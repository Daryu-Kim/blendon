import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type {
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import type { getFirebaseAdmin } from "~/server/utils/firebase-admin";
import type { IdentityCardVerificationResult } from "~/server/utils/identity-card-verification";

type FirebaseAdmin = NonNullable<ReturnType<typeof getFirebaseAdmin>>;

export interface SignupAdultVerification {
  ref: DocumentReference;
  name: string;
  provider: "apick-identi-card";
  birthDate: string;
  verifiedAt: string;
  apickRequestId: number | null;
}

const collectionName = "signupAdultVerifications";
const verificationTtlMs = 30 * 60 * 1000;

const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ");

const toDate = (value: unknown) => {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    const date = value.toDate() as Date;
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

const parseActiveVerification = (
  snap: DocumentSnapshot,
  displayName: string,
): SignupAdultVerification => {
  if (!snap.exists) {
    throw createError({
      statusCode: 400,
      statusMessage: "성인 인증을 먼저 완료해 주세요.",
    });
  }

  const data = snap.data() || {};
  const expiresAt = toDate(data.expiresAt);
  if (!expiresAt || expiresAt.getTime() <= Date.now()) {
    throw createError({
      statusCode: 410,
      statusMessage: "성인 인증 시간이 만료되었습니다. 다시 인증해 주세요.",
    });
  }
  if (data.consumedAt) {
    throw createError({
      statusCode: 400,
      statusMessage: "이미 사용된 성인 인증입니다. 다시 인증해 주세요.",
    });
  }
  if (normalizeName(String(data.name || "")) !== normalizeName(displayName)) {
    throw createError({
      statusCode: 400,
      statusMessage: "성인 인증한 이름과 가입 이름이 일치하지 않습니다.",
    });
  }
  if (
    data.provider !== "apick-identi-card" ||
    typeof data.birthDate !== "string"
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "성인 인증 정보를 확인할 수 없습니다. 다시 인증해 주세요.",
    });
  }

  const apickRequestId = Number(data.apickRequestId);
  return {
    ref: snap.ref,
    name: normalizeName(String(data.name || "")),
    provider: "apick-identi-card",
    birthDate: data.birthDate,
    verifiedAt:
      typeof data.verifiedAt === "string"
        ? data.verifiedAt
        : new Date().toISOString(),
    apickRequestId: Number.isFinite(apickRequestId) ? apickRequestId : null,
  };
};

export const createSignupAdultVerification = async (
  admin: FirebaseAdmin,
  name: string,
  verification: IdentityCardVerificationResult,
) => {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + verificationTtlMs);
  const timestamp = FieldValue.serverTimestamp();
  await admin.db
    .collection(collectionName)
    .doc(token)
    .set({
      name: normalizeName(name),
      provider: verification.provider,
      birthDate: verification.birthDate,
      verifiedAt: verification.verifiedAt,
      apickRequestId: verification.apickRequestId,
      expiresAt: Timestamp.fromDate(expiresAt),
      consumedAt: null,
      consumedBy: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

  return {
    token,
    expiresAt: expiresAt.toISOString(),
  };
};

export const getSignupAdultVerification = async (
  admin: FirebaseAdmin,
  token: string,
  displayName: string,
) => {
  const trimmedToken = token.trim();
  if (!trimmedToken) {
    throw createError({
      statusCode: 400,
      statusMessage: "성인 인증을 먼저 완료해 주세요.",
    });
  }

  const snap = await admin.db
    .collection(collectionName)
    .doc(trimmedToken)
    .get();
  return parseActiveVerification(snap, displayName);
};

export const getSignupAdultVerificationForTransaction = async (
  transaction: Transaction,
  verification: SignupAdultVerification,
  displayName: string,
) => {
  const snap = await transaction.get(verification.ref);
  return parseActiveVerification(snap, displayName);
};

export const markSignupAdultVerificationConsumed = (
  transaction: Transaction,
  verification: SignupAdultVerification,
  uid: string,
) => {
  transaction.update(verification.ref, {
    consumedAt: FieldValue.serverTimestamp(),
    consumedBy: uid,
    updatedAt: FieldValue.serverTimestamp(),
  });
};
