import { FieldValue } from "firebase-admin/firestore";
import { brandConfig } from "~/config/brand";
import { requireAdmin } from "~/server/utils/admin-auth";
import {
  normalizePhoneDigits,
  sendSmsMessage,
} from "~/server/utils/sms-service";
import type { GradeCode, Role, TermsAgreement, UserProfile } from "~/types/domain";

interface CreateMemberBody {
  loginId?: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  birthDate?: string;
  userGrade?: GradeCode;
  role?: Role;
  adminMemo?: string;
}

const roleValues: Role[] = ["customer", "staff", "manager", "admin", "owner"];

const consent = (accepted = false, agreedAt: string | null = null) => ({
  accepted,
  agreedAt,
});

const defaultTermsAgreement = (): TermsAgreement => ({
  service: consent(),
  privacy: consent(),
  refund: consent(),
  marketing: consent(),
  nightMarketing: consent(),
  agreedAt: null,
});

const toBirthDate = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  throw createError({
    statusCode: 400,
    statusMessage: "생년월일은 YYYY-MM-DD 또는 YYYYMMDD 형식으로 입력해 주세요.",
  });
};

const getGrade = async (
  admin: Awaited<ReturnType<typeof requireAdmin>>["admin"],
  gradeCode?: string,
) => {
  if (gradeCode) {
    const gradeSnap = await admin.db.collection("gradeBenefits").doc(gradeCode).get();
    if (gradeSnap.exists) {
      const grade = gradeSnap.data();
      return {
        gradeCode: String(grade?.gradeCode || gradeCode),
        level: Number(grade?.level || 1),
      };
    }
  }

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

const createTemporaryPassword = (phoneNumber: string) => {
  const digits = normalizePhoneDigits(phoneNumber);
  if (digits.length < 4) {
    throw createError({
      statusCode: 400,
      statusMessage: "임시 비밀번호 생성을 위해 휴대폰 번호 뒤 4자리가 필요합니다.",
    });
  }
  return `Blendon${digits.slice(-4)}!@`;
};

export default defineEventHandler(async (event) => {
  const { admin, decoded, role: adminRole } = await requireAdmin(event);
  const body = (await readBody<CreateMemberBody>(event)) || {};
  const loginId = String(body.loginId || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const displayName = String(body.displayName || "").trim();
  const phoneNumber = String(body.phoneNumber || "").trim();
  const birthDate = toBirthDate(String(body.birthDate || ""));
  const memberRole = roleValues.includes(body.role || "customer")
    ? (body.role || "customer")
    : "customer";
  const adminMemo = String(body.adminMemo || "").trim();

  if (!/^[a-zA-Z0-9._-]{4,30}$/.test(loginId)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "아이디는 영문, 숫자, 일부 기호 포함 4자 이상으로 입력해 주세요.",
    });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: "로그인에 사용할 이메일을 정확히 입력해 주세요.",
    });
  }
  if (!displayName || !phoneNumber) {
    throw createError({
      statusCode: 400,
      statusMessage: "회원 이름과 휴대폰 번호를 입력해 주세요.",
    });
  }
  if (memberRole === "owner" && adminRole !== "owner") {
    throw createError({
      statusCode: 403,
      statusMessage: "owner 권한 회원은 owner만 생성할 수 있습니다.",
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

  const duplicateAuthUser = await admin.auth
    .getUserByEmail(email)
    .catch(() => null);
  if (duplicateAuthUser) {
    throw createError({
      statusCode: 409,
      statusMessage: "이미 가입된 이메일입니다.",
    });
  }

  const temporaryPassword = createTemporaryPassword(phoneNumber);
  const grade = await getGrade(admin, body.userGrade);
  const now = new Date().toISOString();
  const userRecord = await admin.auth.createUser({
    email,
    password: temporaryPassword,
    displayName,
    disabled: false,
  });

  const profile: UserProfile = {
    uid: userRecord.uid,
    loginId,
    email,
    displayName,
    phoneNumber,
    birthDate,
    isAdultVerified: true,
    adultVerifiedAt: now,
    adultVerificationProvider: "admin-manual",
    userGrade: grade.gradeCode,
    userGradeLevel: grade.level,
    gradeEvaluatedAt: null,
    gradePurchaseAmount6Months: 0,
    isGradeLocked: false,
    gradeLockedAt: null,
    gradeLockedBy: null,
    gradeLockReason: "",
    role: memberRole,
    availablePoint: 0,
    totalPurchaseAmount: 0,
    mustChangePassword: true,
    passwordChangedAt: null,
    createdByAdmin: true,
    status: "active",
    isWithdrawn: false,
    withdrawnAt: null,
    withdrawnBy: null,
    withdrawReason: "",
    createdAt: now,
    updatedAt: now,
    defaultAddress: null,
    termsAgreement: defaultTermsAgreement(),
    adminMemo,
  };

  const timestamp = FieldValue.serverTimestamp();
  try {
    await admin.db.runTransaction(async (transaction) => {
      transaction.set(admin.db.collection("users").doc(userRecord.uid), {
        ...profile,
        adultVerifiedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      transaction.set(admin.db.collection("adultVerificationLogs").doc(), {
        userId: userRecord.uid,
        provider: "admin-manual",
        status: "verified",
        birthDate,
        requestedAt: timestamp,
        verifiedAt: timestamp,
        reason: "관리자 수동 확인",
        adminId: decoded.uid,
        adminEmail: decoded.email || null,
      });
    });
  } catch (error) {
    await admin.auth.deleteUser(userRecord.uid).catch(() => undefined);
    throw error;
  }

  const smsMessage = `[${brandConfig.name}] 회원가입이 완료되었습니다. 아이디: ${loginId} / 임시 비밀번호: ${temporaryPassword} 로그인 후 비밀번호를 변경해 주세요.`;
  const sms = await sendSmsMessage({
    to: phoneNumber,
    message: smsMessage,
    category: "member-created",
    targetUid: userRecord.uid,
  });

  await admin.db.collection("adminLogs").add({
    action: "member.created",
    targetUid: userRecord.uid,
    targetEmail: email,
    adminId: decoded.uid,
    adminEmail: decoded.email || null,
    smsStatus: sms.status,
    createdAt: timestamp,
  });

  return {
    ok: true,
    profile,
    sms,
    temporaryPassword: sms.sent ? undefined : temporaryPassword,
    manualSmsMessage: sms.sent ? undefined : smsMessage,
  };
});
