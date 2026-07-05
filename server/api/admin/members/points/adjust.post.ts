import { FieldValue } from "firebase-admin/firestore";
import type { PointLog } from "~/types/domain";
import { requireAdmin } from "~/server/utils/admin-auth";

export default defineEventHandler(async (event) => {
  const { admin, decoded } = await requireAdmin(event);
  const body = await readBody<{
    uid?: string;
    amount?: number;
    memo?: string;
  }>(event);
  const uid = String(body.uid || "");
  const amount = Math.trunc(Number(body.amount || 0));
  const memo = String(body.memo || "").trim();

  if (!uid) {
    throw createError({
      statusCode: 400,
      statusMessage: "회원 식별자가 필요합니다.",
    });
  }
  if (!amount) {
    throw createError({
      statusCode: 400,
      statusMessage: "지급 또는 차감할 포인트를 입력해 주세요.",
    });
  }
  if (!memo) {
    throw createError({
      statusCode: 400,
      statusMessage: "포인트 처리 사유를 입력해 주세요.",
    });
  }

  const userRef = admin.db.collection("users").doc(uid);
  const logRef = admin.db.collection("pointLogs").doc();
  const now = new Date().toISOString();

  const result = await admin.db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw createError({
        statusCode: 404,
        statusMessage: "회원을 찾을 수 없습니다.",
      });
    }

    const user = userSnap.data() || {};
    const balanceBefore = Number(user.availablePoint || 0);
    const balanceAfter = balanceBefore + amount;
    if (balanceAfter < 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "보유 포인트보다 많이 차감할 수 없습니다.",
      });
    }

    const log = {
      id: logRef.id,
      userId: uid,
      type: "adjust",
      reason: amount > 0 ? "admin-grant" : "admin-deduct",
      amount,
      balanceBefore,
      balanceAfter,
      orderId: null,
      orderNo: null,
      adminId: decoded.uid,
      adminEmail: decoded.email || null,
      memo,
      createdAt: now,
    } satisfies PointLog;

    tx.update(userRef, {
      availablePoint: balanceAfter,
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(logRef, {
      ...log,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.set(admin.db.collection("adminAuditLogs").doc(), {
      action: "member.point.adjust",
      targetCollection: "users",
      targetId: uid,
      adminId: decoded.uid,
      amount,
      memo,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { availablePoint: balanceAfter, log };
  });

  return result;
});
