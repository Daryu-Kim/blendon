interface SendSmsInput {
  to: string;
  message: string;
  category: string;
  targetUid?: string;
}

export interface SendSmsResult {
  sent: boolean;
  status: "sent" | "not_configured" | "failed";
  message?: string;
}

export const normalizePhoneDigits = (value: string) =>
  value.replace(/\D/g, "");

export const maskPhoneNumber = (value: string) => {
  const digits = normalizePhoneDigits(value);
  if (digits.length < 7) return value;
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
};

export const sendSmsMessage = async (
  input: SendSmsInput,
): Promise<SendSmsResult> => {
  const config = useRuntimeConfig();
  const webhookUrl = String(config.smsWebhookUrl || "").trim();

  if (!webhookUrl) {
    return {
      sent: false,
      status: "not_configured",
      message: "SMS 발송 설정이 없어 문자 발송은 보류되었습니다.",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.smsWebhookSecret
          ? { Authorization: `Bearer ${config.smsWebhookSecret}` }
          : {}),
      },
      body: JSON.stringify({
        to: normalizePhoneDigits(input.to),
        from: config.smsSenderNumber || undefined,
        message: input.message,
        category: input.category,
        targetUid: input.targetUid,
      }),
    });

    if (!response.ok) {
      return {
        sent: false,
        status: "failed",
        message: "SMS 발송 서버가 요청을 처리하지 못했습니다.",
      };
    }

    return { sent: true, status: "sent" };
  } catch {
    return {
      sent: false,
      status: "failed",
      message: "SMS 발송 서버 연결이 원활하지 않습니다.",
    };
  }
};
