import {
  FieldValue,
  type DocumentData,
  type DocumentReference,
} from "firebase-admin/firestore";
import { getFirebaseAdmin } from "~/server/utils/firebase-admin";
import type { GradeBenefit, Order, UserProfile } from "~/types/domain";

const toPlainOrder = (id: string, data: DocumentData) =>
  ({ id, ...data }) as Order;

export const getServerOrder = async (orderId: string) => {
  const admin = getFirebaseAdmin();
  if (!admin) {
    throw createError({
      statusCode: 500,
      statusMessage: "Firebase Admin 설정이 필요합니다.",
    });
  }
  const snap = await admin.db.collection("orders").doc(orderId).get();
  return snap.exists ? toPlainOrder(snap.id, snap.data() || {}) : null;
};

export const saveServerOrder = async (order: Order) => {
  const admin = getFirebaseAdmin();
  if (!admin) {
    throw createError({
      statusCode: 500,
      statusMessage: "Firebase Admin 설정이 필요합니다.",
    });
  }
  await admin.db.collection("orders").doc(order.id).set(order, { merge: true });
  return order;
};

export const confirmServerOrderPayment = async (
  order: Order,
  paymentId: string,
) => {
  const admin = getFirebaseAdmin();
  if (!admin) {
    throw createError({
      statusCode: 500,
      statusMessage: "Firebase Admin 설정이 필요합니다.",
    });
  }

  const now = new Date().toISOString();
  const confirmed: Order = {
    ...order,
    paymentStatus: "paid",
    orderStatus: "confirmed",
    deliveryStatus: order.pickupType === "delivery" ? "ready" : "pickup-ready",
    portonePaymentId: paymentId,
    paymentId,
    paidAt: now,
    updatedAt: now,
  };

  await admin.db.runTransaction(async (tx) => {
    const orderRef = admin.db.collection("orders").doc(order.id);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) {
      throw createError({
        statusCode: 404,
        statusMessage: "주문을 찾을 수 없습니다.",
      });
    }
    const current = orderSnap.data() as Order;
    if (current.paymentStatus === "paid") return;

    const productUpdates: Array<{
      ref: DocumentReference;
      nextOptions: unknown[];
      quantity: number;
    }> = [];

    for (const item of order.items) {
      const productRef = admin.db.collection("products").doc(item.productId);
      const productSnap = await tx.get(productRef);
      if (!productSnap.exists) {
        throw createError({
          statusCode: 404,
          statusMessage: "상품을 찾을 수 없습니다.",
        });
      }
      const product = productSnap.data() || {};
      const optionIndex = Array.isArray(product.options)
        ? product.options.findIndex(
            (option) => option.optionId === item.optionId,
          )
        : -1;
      const option = optionIndex >= 0 ? product.options[optionIndex] : null;
      if (
        (product.stock || 0) < item.quantity ||
        !option ||
        (option.stock || 0) < item.quantity
      ) {
        throw createError({
          statusCode: 409,
          statusMessage: "재고가 부족합니다.",
        });
      }

      const nextOptions = [...product.options];
      nextOptions[optionIndex] = {
        ...option,
        stock: option.stock - item.quantity,
      };
      productUpdates.push({
        ref: productRef,
        nextOptions,
        quantity: item.quantity,
      });
    }

    const userRef = admin.db.collection("users").doc(order.userId);
    const userSnap = await tx.get(userRef);
    const user = userSnap.data() as UserProfile | undefined;
    const gradeSnap = user?.userGrade
      ? await tx.get(admin.db.collection("gradeBenefits").doc(user.userGrade))
      : null;
    const grade = gradeSnap?.exists
      ? ({ id: gradeSnap.id, ...gradeSnap.data() } as GradeBenefit)
      : null;
    const earnedPoint = Math.max(
      0,
      Math.floor(order.totalAmount * (Number(grade?.pointRate || 0) / 100)),
    );

    productUpdates.forEach((update) => {
      tx.update(update.ref, {
        stock: FieldValue.increment(-update.quantity),
        options: update.nextOptions,
        updatedAt: now,
      });
    });
    tx.set(orderRef, confirmed, { merge: true });
    const balanceBefore = Number(user?.availablePoint || 0);
    let nextBalance = balanceBefore;
    if (order.pointUsed > 0) {
      const usedLogRef = admin.db.collection("pointLogs").doc();
      nextBalance -= order.pointUsed;
      tx.set(usedLogRef, {
        userId: order.userId,
        type: "use",
        reason: "order-used",
        amount: -order.pointUsed,
        balanceBefore,
        balanceAfter: nextBalance,
        orderId: order.id,
        orderNo: order.orderNo,
        adminId: null,
        adminEmail: null,
        memo: `주문 ${order.orderNo} 포인트 사용`,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    if (earnedPoint > 0) {
      const earnedLogRef = admin.db.collection("pointLogs").doc();
      const earnedBefore = nextBalance;
      nextBalance += earnedPoint;
      tx.set(earnedLogRef, {
        userId: order.userId,
        type: "earn",
        reason: "order-earned",
        amount: earnedPoint,
        balanceBefore: earnedBefore,
        balanceAfter: nextBalance,
        orderId: order.id,
        orderNo: order.orderNo,
        adminId: null,
        adminEmail: null,
        memo: `주문 ${order.orderNo} 등급 적립`,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    tx.update(userRef, {
      availablePoint: nextBalance,
      totalPurchaseAmount: FieldValue.increment(order.totalAmount),
      updatedAt: now,
    });
  });

  return confirmed;
};
