import { getFirebaseAdmin } from "~/server/utils/firebase-admin";
import { verifyIdentityCardWithApick } from "~/server/utils/identity-card-verification";
import { createSignupAdultVerification } from "~/server/utils/signup-adult-verification";

interface SignupVerificationBody {
  name?: string;
  rrn1?: string;
  rrn2?: string;
  issueDate?: string;
}

const verificationFailureStatusCodes = new Set([400, 403, 422, 502]);

const verificationFailureMessage = (error: unknown) => {
  const record = error as {
    statusCode?: number;
    statusMessage?: string;
    message?: string;
    data?: {
      statusCode?: number;
      statusMessage?: string;
      message?: string;
    };
  };
  const statusCode = Number(
    record?.statusCode || record?.data?.statusCode || 500,
  );
  const message =
    record?.statusMessage ||
    record?.data?.statusMessage ||
    record?.data?.message ||
    record?.message ||
    "성인 인증에 실패했어요. 입력한 정보를 다시 확인해 주세요.";
  return { statusCode, message };
};

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
  let verification;
  try {
    verification = await verifyIdentityCardWithApick({
      name,
      rrn1: body.rrn1 || "",
      rrn2: body.rrn2 || "",
      issueDate: body.issueDate || "",
    });
  } catch (error) {
    const failure = verificationFailureMessage(error);
    if (verificationFailureStatusCodes.has(failure.statusCode)) {
      return {
        ok: false,
        message: failure.message,
      };
    }
    throw error;
  }
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
