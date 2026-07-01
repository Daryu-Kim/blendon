interface PortOnePaymentResponse {
  id?: string;
  paymentId?: string;
  status?: string;
  amount?: {
    total?: number;
    paid?: number;
  };
  paidAmount?: number;
  currency?: string;
}

export interface VerifiedPayment {
  paymentId: string;
  status: "PAID" | "FAILED" | "CANCELED" | "READY" | "UNKNOWN";
  paidAmount: number;
  raw: unknown;
}

export const getPortOnePayment = async (
  paymentId: string,
  expectedAmount: number,
): Promise<VerifiedPayment> => {
  const config = useRuntimeConfig();
  const mockEnabled = config.public.enableMockPayments;

  if (mockEnabled || !config.portoneApiSecret) {
    return {
      paymentId,
      status: "PAID",
      paidAmount: expectedAmount,
      raw: { mode: "mock" },
    };
  }

  const response = await $fetch<PortOnePaymentResponse>(
    `https://api.portone.io/payments/${paymentId}`,
    {
      headers: {
        Authorization: `PortOne ${config.portoneApiSecret}`,
      },
    },
  );

  const rawStatus = `${response.status || ""}`.toUpperCase();
  const paidAmount =
    response.amount?.paid ?? response.amount?.total ?? response.paidAmount ?? 0;
  const normalizedStatus = rawStatus.includes("PAID")
    ? "PAID"
    : rawStatus.includes("CANCEL")
      ? "CANCELED"
      : rawStatus.includes("FAIL")
        ? "FAILED"
        : rawStatus.includes("READY")
          ? "READY"
          : "UNKNOWN";

  return {
    paymentId: response.paymentId || response.id || paymentId,
    status: normalizedStatus,
    paidAmount,
    raw: response,
  };
};
