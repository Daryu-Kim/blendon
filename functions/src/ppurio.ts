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
  messageType?: "SMS" | "LMS";
  refKey?: string;
  messageKey?: string;
}

interface PpurioTokenResponse {
  token?: string;
  type?: string;
  expired?: number | string;
  code?: number;
  description?: string;
}

interface PpurioMessageResponse {
  code?: number;
  description?: string;
  refKey?: string;
  messageKey?: string;
  messsageKey?: string;
}

interface CachedPpurioToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedPpurioToken | null = null;

export const normalizePhoneDigits = (value: string) => value.replace(/\D/g, "");

const ppurioErrorMessage = (
  response?: PpurioTokenResponse | PpurioMessageResponse,
) => {
  if (!response?.code)
    return "뿌리오 문자 발송 요청을 처리하지 못했습니다.";

  const messages: Record<number, string> = {
    2000: "뿌리오 문자 발송 요청 형식이 올바르지 않습니다.",
    3001: "뿌리오 인증 헤더가 올바르지 않습니다.",
    3002: "뿌리오 토큰이 유효하지 않습니다.",
    3003: "뿌리오 연동 IP가 유효하지 않습니다.",
    3004: "뿌리오 계정이 유효하지 않습니다.",
    3005: "뿌리오 토큰이 유효하지 않습니다.",
    3006: "뿌리오 인증 헤더가 유효하지 않습니다.",
    3007: "뿌리오 토큰 발급에 실패했습니다.",
    3008: "뿌리오 요청이 너무 많습니다.",
    4004: "뿌리오 API 접근 권한이 비활성화 상태입니다.",
    4006: "뿌리오 개발 인증키가 유효하지 않습니다.",
    4007: "뿌리오 개발 인증키가 발급되지 않았습니다.",
  };

  return (
    messages[response.code] ||
    response.description ||
    "뿌리오 문자 발송 중 오류가 발생했습니다."
  );
};

const parsePpurioExpiredAt = (expired?: number | string) => {
  const value = String(expired || "");
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!match) return Date.now() + 23 * 60 * 60 * 1000;

  const [, year, month, day, hour, minute, second] = match;
  const expiresAt = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ).getTime();

  return Number.isFinite(expiresAt)
    ? expiresAt
    : Date.now() + 23 * 60 * 60 * 1000;
};

export const getKoreanSmsBytes = (value: string) =>
  Array.from(value).reduce((sum, char) => {
    const code = char.charCodeAt(0);
    return sum + (code <= 0x7f ? 1 : 2);
  }, 0);

const messageTypeFor = (message: string): "SMS" | "LMS" =>
  getKoreanSmsBytes(message) <= 90 ? "SMS" : "LMS";

const normalizeApiBaseUrl = (value: unknown) =>
  String(value || "https://message.ppurio.com").replace(/\/+$/, "");

const createRefKey = (input: SendSmsInput) =>
  [input.category, input.targetUid || Date.now().toString(36)]
    .join("-")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 32);

const getPpurioAccessToken = async () => {
  const account = String(process.env.PPURIO_ACCOUNT || "").trim();
  const authKey = String(process.env.PPURIO_AUTH_KEY || "").trim();
  const apiBaseUrl = normalizeApiBaseUrl(process.env.PPURIO_API_BASE_URL);

  if (!account || !authKey) {
    return {
      ok: false as const,
      message: "뿌리오 계정 또는 개발 인증키가 설정되지 않았습니다.",
    };
  }

  if (cachedToken && cachedToken.expiresAt - Date.now() > 5 * 60 * 1000) {
    return { ok: true as const, token: cachedToken.token };
  }

  const basicToken = Buffer.from(`${account}:${authKey}`).toString("base64");
  const response = await fetch(`${apiBaseUrl}/v1/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicToken}`,
      Accept: "application/json",
    },
  });
  const data = (await response.json().catch(() => ({}))) as PpurioTokenResponse;

  if (!response.ok || !data.token) {
    cachedToken = null;
    return {
      ok: false as const,
      message: ppurioErrorMessage(data),
    };
  }

  cachedToken = {
    token: data.token,
    expiresAt: parsePpurioExpiredAt(data.expired),
  };

  return { ok: true as const, token: cachedToken.token };
};

export const sendPpurioSms = async (
  input: SendSmsInput,
): Promise<SendSmsResult> => {
  const account = String(process.env.PPURIO_ACCOUNT || "").trim();
  const from = normalizePhoneDigits(String(process.env.PPURIO_SENDER_NUMBER || ""));
  const to = normalizePhoneDigits(input.to);
  const apiBaseUrl = normalizeApiBaseUrl(process.env.PPURIO_API_BASE_URL);
  const messageType = messageTypeFor(input.message);
  const refKey = createRefKey(input);

  if (!to) {
    return {
      sent: false,
      status: "failed",
      message: "수신 번호가 올바르지 않아 SMS를 발송하지 못했습니다.",
      messageType,
      refKey,
    };
  }

  if (!account || !String(process.env.PPURIO_AUTH_KEY || "").trim() || !from) {
    return {
      sent: false,
      status: "not_configured",
      message: "뿌리오 문자 발송 설정이 없어 SMS 발송은 보류되었습니다.",
      messageType,
      refKey,
    };
  }

  try {
    const tokenResult = await getPpurioAccessToken();
    if (!tokenResult.ok) {
      return {
        sent: false,
        status: "failed",
        message: tokenResult.message,
        messageType,
        refKey,
      };
    }

    const response = await fetch(`${apiBaseUrl}/v1/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${tokenResult.token}`,
      },
      body: JSON.stringify({
        account,
        messageType,
        content: input.message,
        from,
        duplicateFlag: "N",
        targetCount: 1,
        targets: [{ to }],
        refKey,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as PpurioMessageResponse;

    if (!response.ok || data.code !== 1000) {
      if (data.code === 3002 || data.code === 3005) cachedToken = null;
      return {
        sent: false,
        status: "failed",
        message: ppurioErrorMessage(data),
        messageType,
        refKey,
      };
    }

    return {
      sent: true,
      status: "sent",
      messageType,
      refKey: data.refKey || refKey,
      messageKey: data.messageKey || data.messsageKey,
    };
  } catch {
    return {
      sent: false,
      status: "failed",
      message: "뿌리오 문자 발송 서버 연결이 원활하지 않습니다.",
      messageType,
      refKey,
    };
  }
};
