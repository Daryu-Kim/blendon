import { randomUUID } from "node:crypto";

interface ApickIdentityCardResponse {
  data?: {
    ic_id?: number | string;
    type?: number | string;
    result?: number | string;
    msg?: string;
    success?: number | string;
  };
  api?: {
    success?: boolean;
    cost?: number;
    ms?: number;
    pl_id?: number;
  };
}

export interface IdentityCardVerificationInput {
  name: string;
  rrn1: string;
  rrn2: string;
  issueDate: string;
}

export interface IdentityCardVerificationResult {
  provider: "apick-identi-card";
  birthDate: string;
  verifiedAt: string;
  apickRequestId: number | null;
}

const onlyDigits = (value: string) => value.replace(/\D/g, "");
const normalizeIdentityName = (value: string) =>
  value.trim().replace(/\s+/g, "");
const systemErrorMessage =
  "성인 인증 전산 오류로 확인을 완료하지 못했습니다. 관리자에게 문의해 주세요.";
const isOperationalFailureMessage = (message = "") =>
  /잔액|포인트|충전|인증키|권한|forbidden|unauthorized|오류|error|fail/i.test(
    message,
  );

const multipartTextBody = (fields: Record<string, string>) => {
  const boundary = `----blendon-${randomUUID()}`;
  const chunks: Buffer[] = [];
  Object.entries(fields).forEach(([name, value]) => {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n`,
      ),
      Buffer.from(value, "utf8"),
      Buffer.from("\r\n"),
    );
  });
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  const body = Buffer.concat(chunks);
  return {
    body,
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`,
      "content-length": String(body.byteLength),
    },
  };
};

const isValidYmd = (value: string) => {
  if (!/^\d{8}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const date = new Date(year, month - 1, day);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const isAdultBirthDate = (birthDate: string) => {
  const birth = new Date(`${birthDate}T00:00:00+09:00`);
  if (Number.isNaN(birth.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()))
    age -= 1;
  return age >= 19;
};

export const birthDateFromRrn = (rrn1Value: string, rrn2Value: string) => {
  const rrn1 = onlyDigits(rrn1Value);
  const rrn2 = onlyDigits(rrn2Value);
  if (!/^\d{6}$/.test(rrn1) || !/^\d{7}$/.test(rrn2)) {
    throw createError({
      statusCode: 400,
      statusMessage: "주민등록번호를 정확히 입력해 주세요.",
    });
  }

  const centuryCode = rrn2[0];
  const century =
    centuryCode === "1" ||
    centuryCode === "2" ||
    centuryCode === "5" ||
    centuryCode === "6"
      ? "19"
      : centuryCode === "3" ||
          centuryCode === "4" ||
          centuryCode === "7" ||
          centuryCode === "8"
        ? "20"
        : centuryCode === "9" || centuryCode === "0"
          ? "18"
          : "";
  if (!century) {
    throw createError({
      statusCode: 400,
      statusMessage: "주민등록번호를 정확히 입력해 주세요.",
    });
  }

  const year = Number(`${century}${rrn1.slice(0, 2)}`);
  const month = Number(rrn1.slice(2, 4));
  const day = Number(rrn1.slice(4, 6));
  const birthDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "주민등록번호 생년월일을 확인해 주세요.",
    });
  }

  return birthDate;
};

export const verifyIdentityCardWithApick = async (
  input: IdentityCardVerificationInput,
): Promise<IdentityCardVerificationResult> => {
  const name = normalizeIdentityName(input.name);
  const rrn1 = onlyDigits(input.rrn1);
  const rrn2 = onlyDigits(input.rrn2);
  const issueDate = onlyDigits(input.issueDate);
  const birthDate = birthDateFromRrn(rrn1, rrn2);

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "이름을 입력해 주세요.",
    });
  }
  if (!isValidYmd(issueDate)) {
    throw createError({
      statusCode: 400,
      statusMessage: "주민등록증 발급일자를 YYYYMMDD 형식으로 입력해 주세요.",
    });
  }
  if (!isAdultBirthDate(birthDate)) {
    throw createError({
      statusCode: 422,
      statusMessage: "성인 고객만 가입할 수 있습니다.",
    });
  }

  const config = useRuntimeConfig();
  if (!config.apickAuthKey) {
    throw createError({
      statusCode: 502,
      statusMessage: systemErrorMessage,
    });
  }

  const multipart = multipartTextBody({
    name,
    rrn1,
    rrn2,
    date: issueDate,
  });

  let response: ApickIdentityCardResponse;
  try {
    response = await $fetch<ApickIdentityCardResponse>(
      "https://apick.app/rest/identi_card/1",
      {
        method: "POST",
        headers: {
          ...multipart.headers,
          CL_AUTH_KEY: String(config.apickAuthKey),
        },
        body: multipart.body,
      },
    );
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: systemErrorMessage,
    });
  }

  if (response.api?.success !== true) {
    throw createError({
      statusCode: 502,
      statusMessage: systemErrorMessage,
    });
  }
  const apickResult = Number(response.data?.result);
  if (apickResult !== 1) {
    const apickMessage = response.data?.msg || "";
    const operationalFailure = isOperationalFailureMessage(apickMessage);
    throw createError({
      statusCode: operationalFailure ? 502 : 422,
      statusMessage:
        operationalFailure
          ? systemErrorMessage
          : apickMessage ||
            "성명, 주민등록번호, 발급일자가 주민등록증 기록과 일치하지 않습니다. 발급일자는 주민등록증 하단의 발급일자를 YYYYMMDD로 입력해 주세요.",
    });
  }

  const apickRequestId = Number(response.data?.ic_id);
  return {
    provider: "apick-identi-card",
    birthDate,
    verifiedAt: new Date().toISOString(),
    apickRequestId: Number.isFinite(apickRequestId) ? apickRequestId : null,
  };
};
