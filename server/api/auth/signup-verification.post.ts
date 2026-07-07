import { getFirebaseAdmin } from "~/server/utils/firebase-admin";
import { verifyIdentityCardWithApick } from "~/server/utils/identity-card-verification";
import { createSignupAdultVerification } from "~/server/utils/signup-adult-verification";

interface SignupVerificationBody {
  name?: string;
  rrn1?: string;
  rrn2?: string;
  issueDate?: string;
}

export default defineEventHandler(async (event) => {
  const body = (await readBody<SignupVerificationBody>(event)) || {};
  const admin = getFirebaseAdmin();
  if (!admin) {
    throw createError({
      statusCode: 500,
      statusMessage: "Firebase Admin 설정이 필요합니다.",
    });
  }

  const name = String(body.name || "").trim();
  const verification = await verifyIdentityCardWithApick({
    name,
    rrn1: body.rrn1 || "",
    rrn2: body.rrn2 || "",
    issueDate: body.issueDate || "",
  });
  const signupVerification = await createSignupAdultVerification(
    admin,
    name,
    verification,
  );

  return {
    ok: true,
    provider: verification.provider,
    verificationToken: signupVerification.token,
    expiresAt: signupVerification.expiresAt,
  };
});
