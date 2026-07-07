import {
  canBuyProduct,
  canViewProductWithCategories,
  currentUnitPrice,
  gradeDiscountAmount,
  qualifiesForGradeFreeShipping,
  regularMemberUnitPrice,
} from "~/utils/access";
import { createOrderNo } from "~/utils/format";
import type {
  Address,
  CartItem,
  Order,
  OrderItem,
  PaymentMethod,
  PickupType,
  Category,
  GradeBenefit,
  Product,
  UserProfile,
} from "~/types/domain";

export interface ServerCheckoutInput {
  recipientName: string;
  recipientPhone: string;
  address: Address;
  deliveryMemo: string;
  pickupType: PickupType;
  pointUsed: number;
  paymentMethod: PaymentMethod;
}

export interface OrderCheckoutSettings {
  baseDeliveryFee: number;
  depositBankName: string;
  depositAccountNumber: string;
  depositAccountHolder: string;
}

const paymentGuideFor = (
  paymentMethod: PaymentMethod,
  settings: OrderCheckoutSettings,
) => {
  if (paymentMethod === "transfer") {
    return [
      "계좌이체를 선택하셨습니다.",
      settings.depositBankName && settings.depositAccountNumber
        ? `${settings.depositBankName} ${settings.depositAccountNumber}`
        : "입금 계좌는 고객센터 안내를 확인해주세요.",
      settings.depositAccountHolder
        ? `예금주: ${settings.depositAccountHolder}`
        : "",
      "입금 기한은 주문 접수 시점부터 24시간입니다.",
      "받는 분 이름으로 이체해주셔야 입금 확인이 가능합니다.",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    "신용/체크카드를 선택하셨습니다.",
    "SMS 결제로 진행되며 영업시간 내 문자로 결제 안내를 보내드립니다.",
    "결제 기한은 주문 접수 시점부터 24시간입니다.",
  ].join("\n");
};

const valueText = (value: string | number | null | undefined) =>
  String(value ?? "").trim();

export const buildPendingOrder = (
  user: UserProfile,
  cartItems: CartItem[],
  checkout: ServerCheckoutInput,
  products: Product[],
  categories: Category[] = [],
  gradeBenefits: GradeBenefit[] = [],
  settings: OrderCheckoutSettings = {
    baseDeliveryFee: 3000,
    depositBankName: "",
    depositAccountNumber: "",
    depositAccountHolder: "",
  },
): Order => {
  const checkoutAddress = checkout.address || {
    zipCode: "",
    address1: "",
    address2: "",
  };
  const pickupType = checkout.pickupType;

  if (!user)
    throw createError({
      statusCode: 401,
      statusMessage: "로그인이 필요합니다.",
    });
  if (!cartItems.length)
    throw createError({
      statusCode: 400,
      statusMessage: "장바구니가 비어 있습니다.",
    });
  if (!valueText(checkout.recipientName))
    throw createError({
      statusCode: 400,
      statusMessage: "받는 분을 입력해 주세요.",
    });
  if (!valueText(checkout.recipientPhone))
    throw createError({
      statusCode: 400,
      statusMessage: "연락처를 입력해 주세요.",
    });
  if (pickupType !== "delivery" && pickupType !== "store-pickup")
    throw createError({
      statusCode: 400,
      statusMessage: "수령 방식을 선택해 주세요.",
    });
  if (
    checkout.paymentMethod !== "card" &&
    checkout.paymentMethod !== "transfer"
  )
    throw createError({
      statusCode: 400,
      statusMessage: "결제수단을 선택해 주세요.",
    });
  if (
    pickupType === "delivery" &&
    (!valueText(checkoutAddress.zipCode) || !valueText(checkoutAddress.address1))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "배송 주소를 입력해 주세요.",
    });
  }

  const items: OrderItem[] = cartItems.map((cartItem) => {
    const product = products.find((item) => item.id === cartItem.productId);
    if (!product)
      throw createError({
        statusCode: 404,
        statusMessage: "상품을 찾을 수 없습니다.",
      });
    if (
      !canBuyProduct(product, user, gradeBenefits) ||
      !canViewProductWithCategories(product, categories, user, gradeBenefits)
    )
      throw createError({
        statusCode: 403,
        statusMessage: "상품 구매 권한을 확인해 주세요.",
      });

    const option = product.options.find(
      (item) => item.optionId === cartItem.optionId,
    );
    if (!option || !option.isActive)
      throw createError({
        statusCode: 400,
        statusMessage: "상품 옵션을 확인해 주세요.",
      });
    if (product.stock < cartItem.quantity || option.stock < cartItem.quantity) {
      throw createError({
        statusCode: 409,
        statusMessage: "재고가 부족합니다.",
      });
    }

    const unitPrice =
      currentUnitPrice(product, user, gradeBenefits) + option.additionalPrice;
    const regularUnitPrice =
      regularMemberUnitPrice(product) + option.additionalPrice;
    const discountAmountPerUnit = gradeDiscountAmount(
      product,
      user,
      gradeBenefits,
    );
    return {
      productId: product.id,
      productName: product.name,
      optionId: option.optionId,
      optionName: option.optionName,
      quantity: cartItem.quantity,
      unitPrice,
      regularUnitPrice,
      gradeDiscountAmount: discountAmountPerUnit * cartItem.quantity,
      isGradeDiscountExcluded: Boolean(product.isGradeDiscountExcluded),
      totalPrice: unitPrice * cartItem.quantity,
      thumbnailUrl: product.thumbnailUrl,
      isAdultOnly: product.isAdultOnly,
      nicotineType: product.nicotineType,
    };
  });

  const subtotalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryFee =
    pickupType === "delivery" &&
    !qualifiesForGradeFreeShipping(subtotalAmount, user, gradeBenefits)
      ? Math.max(0, Number(settings.baseDeliveryFee || 0))
      : 0;
  const discountAmount = 0;
  const pointLimit = Math.floor(
    (subtotalAmount + deliveryFee - discountAmount) * 0.1,
  );
  const pointUsed = Math.min(
    Math.max(checkout.pointUsed || 0, 0),
    user.availablePoint,
    pointLimit,
  );
  const totalAmount = subtotalAmount + deliveryFee - discountAmount - pointUsed;
  const now = new Date().toISOString();
  const paymentDueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const orderNo = createOrderNo();

  return {
    id: `order-${orderNo}`,
    orderNo,
    userId: user.uid,
    items,
    subtotalAmount,
    deliveryFee,
    discountAmount,
    pointUsed,
    totalAmount,
    paymentStatus: "ready",
    paymentMethod: checkout.paymentMethod,
    orderStatus: "pending",
    deliveryStatus: "none",
    claimStatus: "none",
    recipientName: valueText(checkout.recipientName),
    recipientPhone: valueText(checkout.recipientPhone),
    address:
      pickupType === "delivery"
        ? {
            zipCode: valueText(checkoutAddress.zipCode),
            address1: valueText(checkoutAddress.address1),
            address2: valueText(checkoutAddress.address2),
          }
        : { zipCode: "", address1: "", address2: "" },
    deliveryMemo:
      pickupType === "delivery" ? valueText(checkout.deliveryMemo) : "",
    pickupType,
    paymentDueAt,
    paymentGuide: paymentGuideFor(checkout.paymentMethod, settings),
    depositBankName: settings.depositBankName,
    depositAccountNumber: settings.depositAccountNumber,
    depositAccountHolder: settings.depositAccountHolder,
    deliveryCompany: "",
    trackingNumber: "",
    shippedAt: null,
    createdAt: now,
    updatedAt: now,
    paidAt: null,
  };
};

export const confirmPaidOrder = (order: Order): Order => ({
  ...order,
  paymentStatus: "paid",
  orderStatus: "confirmed",
  deliveryStatus: order.pickupType === "delivery" ? "ready" : "pickup-ready",
  paidAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const failOrderPayment = (order: Order): Order => ({
  ...order,
  paymentStatus: "failed",
  orderStatus: "pending",
  updatedAt: new Date().toISOString(),
});
