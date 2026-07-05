import type { H3Event } from "h3";
import { getFirebaseAdmin } from "~/server/utils/firebase-admin";

const adminRoles = ["manager", "admin", "owner"];

export const requireAdmin = async (event: H3Event) => {
  const admin = getFirebaseAdmin();
  if (!admin) {
    throw createError({
      statusCode: 500,
      statusMessage: "Firebase Admin 설정이 필요합니다.",
    });
  }

  const token = getHeader(event, "authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "관리자 인증 토큰이 필요합니다.",
    });
  }

  const decoded = await admin.auth.verifyIdToken(token);
  const userSnap = await admin.db.collection("users").doc(decoded.uid).get();
  const role = userSnap.data()?.role || "customer";
  if (!adminRoles.includes(role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "관리자 권한이 필요합니다.",
    });
  }

  return { admin, decoded, role };
};
