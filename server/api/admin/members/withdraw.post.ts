import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin } from "~/server/utils/admin-auth";
import type { UserProfile } from "~/types/domain";

interface WithdrawMemberBody {
  uid?: string;
  reason?: string;
}

const timestampToIso = (value: unknown) => {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date().toISOString();
};

export default defineEventHandler(async (event) => {
  const { admin, decoded } = await requireAdmin(event);
  const body = (await readBody<WithdrawMemberBody>(event)) || {};
  const uid = String(body.uid || "").trim();
  const reason = String(body.reason || "").trim();

  if (!uid) {
    throw createError({
      statusCode: 400,
      statusMessage: "탈퇴 처리할 회원 식별자가 필요합니다.",
    });
  }
  if (uid === decoded.uid) {
    throw createError({
      statusCode: 400,
      statusMessage: "현재 로그인한 관리자 계정은 직접 탈퇴 처리할 수 없습니다.",
    });
  }

  const userRef = admin.db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw createError({
      statusCode: 404,
      statusMessage: "회원을 찾을 수 없습니다.",
    });
  }

  const timestamp = FieldValue.serverTimestamp();
  await admin.auth.updateUser(uid, { disabled: true }).catch(() => undefined);
  await admin.auth.revokeRefreshTokens(uid).catch(() => undefined);
  await userRef.set(
    {
      status: "withdrawn",
      isWithdrawn: true,
      withdrawnAt: timestamp,
      withdrawnBy: decoded.uid,
      withdrawReason: reason || "관리자 탈퇴 처리",
      updatedAt: timestamp,
    },
    { merge: true },
  );
  await admin.db.collection("adminLogs").add({
    action: "member.withdrawn",
    targetUid: uid,
    targetEmail: userSnap.data()?.email || null,
    adminId: decoded.uid,
    adminEmail: decoded.email || null,
    reason: reason || "관리자 탈퇴 처리",
    createdAt: timestamp,
  });

  const updatedSnap = await userRef.get();
  const profile = {
    uid: updatedSnap.id,
    ...updatedSnap.data(),
    createdAt: timestampToIso(updatedSnap.data()?.createdAt),
    updatedAt: timestampToIso(updatedSnap.data()?.updatedAt),
    withdrawnAt: updatedSnap.data()?.withdrawnAt
      ? timestampToIso(updatedSnap.data()?.withdrawnAt)
      : null,
  } as UserProfile;

  return { ok: true, profile };
});
