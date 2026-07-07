import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "~/server/utils/firebase-admin";
import {
  getSignupAdultVerification,
  getSignupAdultVerificationForTransaction,
  markSignupAdultVerificationConsumed,
} from "~/server/utils/signup-adult-verification";
import type { TermsAgreement, UserProfile } from "~/types/domain";

interface SignupBody {
  email?: string;
  password?: string;
  loginId?: string;
  displayName?: string;
  phoneNumber?: string;
  termsAgreement?: TermsAgreement;
  verificationToken?: string;
}

const consent = (accepted = false, agreedAt: string | null = null) => ({
  accepted,
  agreedAt,
});

const normalizeTermsAgreement = (
  terms: Partial<TermsAgreement> | undefined,
): TermsAgreement => {
  const agreedAt =
    typeof terms?.agreedAt === "string"
      ? terms.agreedAt
      : new Date().toISOString();
  return {
    service: consent(
      Boolean(terms?.service?.accepted),
      terms?.service?.agreedAt || agreedAt,
    ),
    privacy: consent(
      Boolean(terms?.privacy?.accepted),
      terms?.privacy?.agreedAt || agreedAt,
    ),
    refund: consent(
      Boolean(terms?.refund?.accepted),
      terms?.refund?.agreedAt || agreedAt,
    ),
    marketing: consent(
      Boolean(terms?.marketing?.accepted),
      terms?.marketing?.accepted ? terms.marketing.agreedAt || agreedAt : null,
    ),
    nightMarketing: consent(
      Boolean(terms?.nightMarketing?.accepted),
      terms?.nightMarketing?.accepted
        ? terms.nightMarketing.agreedAt || agreedAt
        : null,
    ),
    agreedAt,
  };
};

const requiredTermsAccepted = (terms: TermsAgreement) =>
  terms.service.accepted && terms.privacy.accepted && terms.refund.accepted;

const defaultGrade = async (
  admin: NonNullable<ReturnType<typeof getFirebaseAdmin>>,
) => {
  const snap = await admin.db
    .collection("gradeBenefits")
    .orderBy("level", "asc")
    .get()
    .catch(() => null);
  const grade = snap?.docs
    .map((doc) => doc.data())
    .find((item) => item.isVisible !== false);
  return {
    gradeCode: String(grade?.gradeCode || "BASIC"),
    level: Number(grade?.level || 1),
  };
};

export default defineEventHandler(async (event) => {
  const body = (await readBody<SignupBody>(event)) || {};
  const email = String(body.email || "").trim();
  const password = String(body.password || "");
  const loginId = String(body.loginId || "").trim();
  const displayName = String(body.displayName || "").trim();
  const phoneNumber = String(body.phoneNumber || "").trim();
  const termsAgreement = normalizeTermsAgreement(body.termsAgreement);

  if (!/^[a-zA-Z0-9._-]{4,30}$/.test(loginId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "아이디는 영문, 숫자, 일부 기호 포함 4자 이상으로 입력해 주세요.",
    });
  }
  if (!email || !password || password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: "이메일과 비밀번호를 확인해 주세요.",
    });
  }
  if (!displayName || !phoneNumber) {
    throw createError({
      statusCode: 400,
      statusMessage: "이름과 연락처를 입력해 주세요.",
    });
  }
  if (!requiredTermsAccepted(termsAgreement)) {
    throw createError({
      statusCode: 400,
      statusMessage: "필수 약관에 동의해 주세요.",
    });
  }

  const admin = getFirebaseAdmin();
  if (!admin) {
    throw createError({
      statusCode: 500,
      statusMessage: "Firebase Admin 설정이 필요합니다.",
    });
  }

  const duplicateLogin = await admin.db
    .collection("users")
    .where("loginId", "==", loginId)
    .limit(1)
    .get();
  if (!duplicateLogin.empty) {
    throw createError({
      statusCode: 409,
      statusMessage: "이미 사용 중인 아이디입니다.",
    });
  }

  const verification = await getSignupAdultVerification(
    admin,
    String(body.verificationToken || ""),
    displayName,
  );
  const grade = await defaultGrade(admin);
  const now = new Date().toISOString();

  const userRecord = await admin.auth.createUser({
    email,
    password,
    displayName,
  });

  const profile: UserProfile = {
    uid: userRecord.uid,
    loginId,
    email,
    displayName,
    phoneNumber,
    birthDate: verification.birthDate,
    isAdultVerified: true,
    adultVerifiedAt: verification.verifiedAt,
    adultVerificationProvider: verification.provider,
    userGrade: grade.gradeCode,
    userGradeLevel: grade.level,
    gradeEvaluatedAt: null,
    gradePurchaseAmount6Months: 0,
    isGradeLocked: false,
    gradeLockedAt: null,
    gradeLockedBy: null,
    gradeLockReason: "",
    role: "customer",
    availablePoint: 0,
    totalPurchaseAmount: 0,
    createdAt: now,
    updatedAt: now,
    defaultAddress: null,
    termsAgreement,
  };

  try {
    await admin.db.runTransaction(async (transaction) => {
      const activeVerification =
        await getSignupAdultVerificationForTransaction(
          transaction,
          verification,
          displayName,
        );
      const timestamp = FieldValue.serverTimestamp();
      transaction.set(admin.db.collection("users").doc(userRecord.uid), {
        ...profile,
        birthDate: activeVerification.birthDate,
        adultVerifiedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      transaction.set(admin.db.collection("adultVerificationLogs").doc(), {
        userId: userRecord.uid,
        provider: activeVerification.provider,
        status: "verified",
        birthDate: activeVerification.birthDate,
        requestedAt: timestamp,
        verifiedAt: timestamp,
        apickRequestId: activeVerification.apickRequestId,
      });
      markSignupAdultVerificationConsumed(
        transaction,
        activeVerification,
        userRecord.uid,
      );
    });
  } catch (error) {
    await admin.auth.deleteUser(userRecord.uid).catch(() => undefined);
    throw error;
  }

  return { ok: true, profile };
});
