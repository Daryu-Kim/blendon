import { requireAdmin } from "~/server/utils/admin-auth";

interface ResetPasswordBody {
  uid?: string;
  email?: string;
}

export default defineEventHandler(async (event) => {
  const { admin } = await requireAdmin(event);
  const config = useRuntimeConfig();
  const body = await readBody<ResetPasswordBody>(event);

  let email = String(body.email || "").trim();
  if (!email && body.uid) {
    const user = await admin.auth.getUser(String(body.uid));
    email = user.email || "";
  }

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: "비밀번호 재설정 메일을 보낼 이메일이 필요합니다.",
    });
  }

  if (!config.public.firebaseApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Firebase API Key 설정이 필요합니다.",
    });
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${config.public.firebaseApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestType: "PASSWORD_RESET",
        email,
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw createError({
      statusCode: response.status,
      statusMessage: `비밀번호 재설정 메일 발송에 실패했습니다. ${message.slice(0, 120)}`,
    });
  }

  await admin.db.collection("adminLogs").add({
    action: "member.passwordResetEmailSent",
    targetEmail: email,
    targetUid: body.uid || null,
    createdAt: new Date(),
  });

  return { ok: true, email };
});
