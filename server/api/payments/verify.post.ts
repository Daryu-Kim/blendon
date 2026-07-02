import { failOrderPayment } from "~/server/utils/order-service";
import {
  confirmServerOrderPayment,
  getServerOrder,
  saveServerOrder,
} from "~/server/utils/order-store";
import { getPortOnePayment } from "~/server/utils/portone";

export default defineEventHandler(async (event) => {
  const body = await readBody<{ orderId: string; paymentId: string }>(event);
  if (!body.orderId || !body.paymentId) {
    throw createError({
      statusCode: 400,
      statusMessage: "주문 또는 결제 식별자가 누락되었습니다.",
    });
  }

  const order = await getServerOrder(body.orderId);
  if (!order)
    throw createError({
      statusCode: 404,
      statusMessage: "주문을 찾을 수 없습니다.",
    });

  const payment = await getPortOnePayment(body.paymentId, order.totalAmount);
  if (payment.status === "PAID" && payment.paidAmount === order.totalAmount) {
    return {
      order: await confirmServerOrderPayment(order, payment.paymentId),
    };
  }

  return { order: await saveServerOrder(failOrderPayment(order)) };
});
