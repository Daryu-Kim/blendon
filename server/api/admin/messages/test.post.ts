import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin } from "~/server/utils/admin-auth";
import {
  getKoreanSmsBytes,
  normalizePhoneDigits,
  sendSmsMessage,
} from "~/server/utils/sms-service";

interface TestMessageBody {
  to?: string;
  message?: string;
}

export default defineEventHandler(async (event) => {
  const { admin, decoded } = await requireAdmin(event);
  const body = (await readBody<TestMessageBody>(event)) || {};
  const to = normalizePhoneDigits(String(body.to || ""));
  const message = String(body.message || "").trim();

  if (!to || to.length < 8 || to.length > 16) {
    throw createError({
      statusCode: 400,
      statusMessage: "테스트 수신 번호를 정확히 입력해 주세요.",
    });
  }

  if (!message) {
    throw createError({
      statusCode: 400,
      statusMessage: "테스트 메시지 내용을 입력해 주세요.",
    });
  }

  if (message.length > 2000) {
    throw createError({
      statusCode: 400,
      statusMessage: "메시지는 최대 2000자까지 입력할 수 있습니다.",
    });
  }

  const sms = await sendSmsMessage({
    to,
    message,
    category: "admin-test",
    targetUid: decoded.uid,
  });

  await admin.db.collection("adminLogs").add({
    action: "sms.test",
    adminId: decoded.uid,
    adminEmail: decoded.email || null,
    targetPhone: to.replace(/^(\d{3})\d+(\d{4})$/, "$1****$2"),
    smsStatus: sms.status,
    smsSent: sms.sent,
    smsMessageType: sms.messageType || null,
    smsRefKey: sms.refKey || null,
    smsMessageKey: sms.messageKey || null,
    byteLength: getKoreanSmsBytes(message),
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    ok: sms.sent,
    sms,
    byteLength: getKoreanSmsBytes(message),
  };
});
