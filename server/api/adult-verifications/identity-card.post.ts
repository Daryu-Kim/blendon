import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "~/server/utils/firebase-admin";
import { verifyIdentityCardWithApick } from "~/server/utils/identity-card-verification";

export default defineEventHandler(async (event) => {
  const body = (await readBody<{
    idToken?: string;
    name?: string;
    rrn1?: string;
    rrn2?: string;
    issueDate?: string;
  }>(event)) || {};

  const admin = getFirebaseAdmin();
  if (!admin) {
    throw createError({
      statusCode: 500,
      statusMessage: "Firebase Admin 설정이 필요합니다.",
    });
  }
  if (!body.idToken) {
    throw createError({
      statusCode: 401,
      statusMessage: "인증 토큰이 필요합니다.",
    });
  }

  const decoded = await admin.auth.verifyIdToken(body.idToken);
  const verification = await verifyIdentityCardWithApick({
    name: body.name || "",
    rrn1: body.rrn1 || "",
    rrn2: body.rrn2 || "",
    issueDate: body.issueDate || "",
  });

  const timestamp = FieldValue.serverTimestamp();
  await admin.db.collection("users").doc(decoded.uid).set(
    {
      birthDate: verification.birthDate,
      isAdultVerified: true,
      adultVerifiedAt: timestamp,
      adultVerificationProvider: verification.provider,
      updatedAt: timestamp,
    },
    { merge: true },
  );
  await admin.db.collection("adultVerificationLogs").add({
    userId: decoded.uid,
    provider: verification.provider,
    status: "verified",
    birthDate: verification.birthDate,
    requestedAt: timestamp,
    verifiedAt: timestamp,
    apickRequestId: verification.apickRequestId,
  });

  return {
    ok: true,
    provider: verification.provider,
    birthDate: verification.birthDate,
    verifiedAt: verification.verifiedAt,
  };
});
