import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "~/server/utils/firebase-admin";

interface ChangePasswordBody {
  currentPassword?: string;
  newPassword?: string;
}

const verifyCurrentPassword = async (email: string, password: string) => {
  const config = useRuntimeConfig();
  if (!config.public.firebaseApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Firebase API Key 설정이 필요합니다.",
    });
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${config.public.firebaseApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    },
  );

  if (!response.ok) {
    throw createError({
      statusCode: 400,
      statusMessage: "현재 비밀번호가 일치하지 않습니다.",
    });
  }
};

export default defineEventHandler(async (event) => {
  const token = getHeader(event, "authorization")?.replace(/^Bearer\s+/i, "");
  const body = (await readBody<ChangePasswordBody>(event)) || {};
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "로그인이 필요합니다.",
    });
  }
  if (!currentPassword || newPassword.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: "현재 비밀번호와 8자 이상의 새 비밀번호를 입력해 주세요.",
    });
  }
  if (currentPassword === newPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: "새 비밀번호는 현재 비밀번호와 다르게 입력해 주세요.",
    });
  }

  const admin = getFirebaseAdmin();
  if (!admin) {
    throw createError({
      statusCode: 500,
      statusMessage: "Firebase Admin 설정이 필요합니다.",
    });
  }

  const decoded = await admin.auth.verifyIdToken(token);
  const userRecord = await admin.auth.getUser(decoded.uid);
  const email = userRecord.email || decoded.email || "";
  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: "비밀번호를 변경할 이메일 계정을 찾을 수 없습니다.",
    });
  }

  await verifyCurrentPassword(email, currentPassword);

  const timestamp = FieldValue.serverTimestamp();
  await admin.auth.updateUser(decoded.uid, { password: newPassword });
  await admin.db.collection("users").doc(decoded.uid).set(
    {
      mustChangePassword: false,
      passwordChangedAt: timestamp,
      updatedAt: timestamp,
    },
    { merge: true },
  );
  await admin.db.collection("adminLogs").add({
    action: "account.passwordChanged",
    targetUid: decoded.uid,
    targetEmail: email,
    createdAt: timestamp,
  });

  return { ok: true };
});
