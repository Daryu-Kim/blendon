const firebaseMessageMap: Record<string, string> = {
  "auth/invalid-email": "이메일 형식이 올바르지 않습니다.",
  "auth/user-disabled":
    "이 계정은 이용이 제한되었습니다. 고객센터로 문의해 주세요.",
  "auth/user-not-found": "가입된 계정을 찾을 수 없습니다.",
  "auth/wrong-password": "비밀번호가 일치하지 않습니다.",
  "auth/invalid-credential": "이메일 또는 비밀번호를 다시 확인해 주세요.",
  "auth/email-already-in-use": "이미 가입된 이메일입니다.",
  "auth/weak-password": "비밀번호는 6자 이상으로 입력해 주세요.",
  "auth/missing-password": "비밀번호를 입력해 주세요.",
  "auth/too-many-requests": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  "auth/network-request-failed":
    "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
  "auth/popup-closed-by-user": "인증 창이 닫혔습니다. 다시 시도해 주세요.",
  "auth/requires-recent-login": "보안을 위해 다시 로그인한 뒤 진행해 주세요.",
  "permission-denied":
    "권한이 없습니다. 로그인 상태나 이용 권한을 확인해 주세요.",
  unauthenticated: "로그인이 필요합니다.",
  "not-found": "요청한 정보를 찾을 수 없습니다.",
  "already-exists": "이미 등록된 정보입니다.",
  "failed-precondition":
    "처리 조건을 만족하지 못했습니다. 입력값을 확인해 주세요.",
  unavailable: "서비스 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.",
  "deadline-exceeded":
    "요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.",
  "storage/unauthorized": "이미지를 업로드할 권한이 없습니다.",
  "storage/canceled": "이미지 업로드가 취소되었습니다.",
  "storage/retry-limit-exceeded":
    "이미지 업로드 시간이 초과되었습니다. 다시 시도해 주세요.",
};

export const toUserMessage = (
  error: unknown,
  fallback = "처리 중 문제가 발생했습니다.",
) => {
  const record = error as {
    code?: string;
    message?: string;
    statusMessage?: string;
    statusCode?: number;
    data?: {
      statusMessage?: string;
      message?: string;
    };
  };
  const code = record?.code || "";
  if (code && firebaseMessageMap[code]) return firebaseMessageMap[code];

  if (record?.statusMessage) return record.statusMessage;
  if (record?.data?.statusMessage) return record.data.statusMessage;
  if (record?.data?.message) return record.data.message;
  const message = record?.message || "";
  const codeInMessage = Object.keys(firebaseMessageMap).find((key) =>
    message.includes(key),
  );
  if (codeInMessage) return firebaseMessageMap[codeInMessage];

  if (message.includes("Firebase Authentication 설정"))
    return "로그인 설정이 아직 완료되지 않았습니다. 관리자에게 문의해 주세요.";
  if (message.includes("Firebase Admin 설정"))
    return "주문 처리 설정이 아직 완료되지 않았습니다. 고객센터로 문의해 주세요.";
  if (message.includes("Missing or insufficient permissions"))
    return "권한이 없습니다. 로그인 상태나 이용 권한을 확인해 주세요.";
  if (message.includes("network") || message.includes("Network"))
    return "네트워크 연결을 확인한 뒤 다시 시도해 주세요.";

  return fallback;
};
