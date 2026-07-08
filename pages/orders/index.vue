<template>
  <main class="section page-shell">
    <div class="section-title">
      <div>
        <h1>주문 내역</h1>
        <p>결제, 주문, 배송 상태를 확인합니다.</p>
      </div>
    </div>
    <div v-if="orderStore.myOrders.length" class="order-list">
      <article
        v-for="order in orderStore.myOrders"
        :key="order.id"
        class="surface order-card"
      >
        <div class="order-card__summary">
          <div>
            <strong>{{ order.orderNo }}</strong>
            <p>{{ formatDate(order.createdAt) }}</p>
          </div>
          <div class="status-pills">
            <span class="pill">{{
              paymentStatusLabel(order.paymentStatus)
            }}</span>
            <span class="pill">{{ deliveryStatusLabel(order) }}</span>
          </div>
          <strong>{{ formatCurrency(order.totalAmount) }}</strong>
        </div>

        <div v-if="order.trackingNumber" class="tracking-info">
          <span>배송 정보</span>
          <strong>
            {{ order.deliveryCompany || "택배" }}
            {{ order.trackingNumber }}
          </strong>
        </div>

        <div v-if="order.paymentGuide" class="payment-guide">
          <strong>{{ paymentMethodLabel(order.paymentMethod) }}</strong>
          <p>{{ order.paymentGuide }}</p>
          <dl v-if="order.paymentMethod === 'transfer'">
            <div>
              <dt>은행</dt>
              <dd>{{ order.depositBankName || "-" }}</dd>
            </div>
            <div>
              <dt>계좌번호</dt>
              <dd>{{ order.depositAccountNumber || "-" }}</dd>
            </div>
            <div>
              <dt>예금주</dt>
              <dd>{{ order.depositAccountHolder || "-" }}</dd>
            </div>
          </dl>
          <p v-if="order.paymentDueAt" class="deadline">
            결제 기한: {{ formatDate(order.paymentDueAt) }}
          </p>
        </div>

        <div class="order-items">
          <div
            v-for="item in order.items"
            :key="`${order.id}-${item.productId}-${item.optionId}`"
            class="order-item"
          >
            <img
              v-if="item.thumbnailUrl"
              :src="item.thumbnailUrl"
              :alt="item.productName"
            />
            <div v-else class="order-item__empty">{{ item.productName }}</div>
            <div class="order-item__info">
              <strong>{{ item.productName }}</strong>
              <p>{{ item.optionName }} · {{ item.quantity }}개</p>
              <p>{{ formatCurrency(item.totalPrice) }}</p>
            </div>
            <div class="order-item__actions">
              <Button
                v-if="canWriteReview(order)"
                size="sm"
                variant="ghost"
                @click="toggleReview(order.id, item)"
              >
                {{
                  activeReviewKey === reviewKey(order.id, item)
                    ? "닫기"
                    : "리뷰 작성"
                }}
              </Button>
              <span v-else>배송 완료 후 작성 가능</span>
            </div>
            <ProductReviewForm
              v-if="activeReviewKey === reviewKey(order.id, item)"
              class="order-review-form"
              :product="reviewTarget(item)"
              embedded
              @saved="activeReviewKey = ''"
            />
          </div>
        </div>
      </article>
    </div>
    <EmptyState
      v-else
      title="주문 내역이 없어요."
      description="상품을 둘러보고 첫 주문을 시작해 보세요."
      action-label="상품 보기"
      action-to="/products"
    />
  </main>
</template>

<script setup lang="ts">
import type { Order, OrderItem, PaymentMethod } from "~/types/domain";
import { formatCurrency, formatDate } from "~/utils/format";

definePageMeta({ middleware: "auth" });
const orderStore = useOrderStore();
const productStore = useProductStore();
const activeReviewKey = ref("");

const paymentMethodLabel = (method: PaymentMethod) =>
  method === "transfer" ? "계좌이체 안내" : "신용/체크카드 안내";

const paymentStatusLabels: Record<Order["paymentStatus"], string> = {
  pending: "결제 대기",
  ready: "결제 대기",
  paid: "결제 완료",
  failed: "결제 실패",
  canceled: "결제 취소",
  refunded: "환불 완료",
};

const deliveryStatusLabels: Record<Order["deliveryStatus"], string> = {
  none: "배송 준비 전",
  ready: "배송 준비중",
  shipping: "배송중",
  delivered: "배송 완료",
  "pickup-ready": "픽업 준비 완료",
  "picked-up": "픽업 완료",
};

const claimStatusLabels: Record<Order["claimStatus"], string> = {
  none: "",
  requested: "처리 요청 접수",
  approved: "처리 승인",
  rejected: "처리 반려",
  completed: "처리 완료",
};

const paymentStatusLabel = (status: Order["paymentStatus"]) =>
  paymentStatusLabels[status] || status;

const deliveryStatusLabel = (order: Order) => {
  if (order.orderStatus === "canceled") return "주문 취소";
  if (order.claimStatus !== "none") return claimStatusLabels[order.claimStatus];
  if (order.deliveryStatus === "none") {
    if (order.paymentStatus !== "paid") return "결제 확인 대기";
    return order.pickupType === "store-pickup"
      ? "픽업 준비 전"
      : "배송 준비 전";
  }
  return deliveryStatusLabels[order.deliveryStatus] || order.deliveryStatus;
};

const canWriteReview = (order: Order) =>
  order.paymentStatus === "paid" &&
  order.orderStatus !== "canceled" &&
  (order.deliveryStatus === "delivered" ||
    order.deliveryStatus === "picked-up");

const reviewKey = (orderId: string, item: OrderItem) =>
  `${orderId}:${item.productId}:${item.optionId}`;

const toggleReview = (orderId: string, item: OrderItem) => {
  const key = reviewKey(orderId, item);
  activeReviewKey.value = activeReviewKey.value === key ? "" : key;
};

const reviewTarget = (item: OrderItem) => {
  const product = productStore.findById(item.productId);
  return {
    id: item.productId,
    slug: product?.slug || "",
    name: item.productName,
  };
};

onMounted(async () => {
  await Promise.all([orderStore.hydrate(), productStore.fetchCatalog()]);
});
useHead({ title: "주문 내역" });
</script>

<style scoped>
.order-list {
  display: grid;
  gap: 12px;
}

.order-card {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.order-card__summary {
  display: grid;
  gap: 12px;
}

.order-card p {
  margin: 4px 0 0;
  color: var(--color-muted);
}

.status-pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 6px;
}

.tracking-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fbf8f1;
  padding: 10px 12px;
}

.tracking-info span {
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 900;
}

.tracking-info strong {
  word-break: keep-all;
}

.payment-guide {
  display: grid;
  gap: 8px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fbf8f1;
  padding: 12px;
}

.payment-guide p {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: keep-all;
}

.payment-guide dl {
  display: grid;
  gap: 7px;
  margin: 0;
}

.payment-guide dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.payment-guide dt {
  color: var(--color-muted);
}

.payment-guide dd {
  margin: 0;
  font-weight: 900;
  text-align: right;
}

.deadline {
  font-weight: 900;
}

.order-items {
  display: grid;
  gap: 10px;
  border-top: 1px solid var(--color-line);
  padding-top: 12px;
}

.order-item {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.order-item img,
.order-item__empty {
  width: 72px;
  aspect-ratio: 1;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  object-fit: cover;
}

.order-item__empty {
  display: grid;
  place-items: center;
  background: #fff;
  color: var(--color-muted);
  padding: 8px;
  font-size: 12px;
  font-weight: 800;
  text-align: center;
  word-break: keep-all;
}

.order-item__info {
  min-width: 0;
}

.order-item__info strong {
  word-break: keep-all;
}

.order-item__actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
}

.order-item__actions span {
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.order-review-form {
  grid-column: 1 / -1;
}

@media (min-width: 760px) {
  .order-card__summary {
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
  }

  .order-item {
    grid-template-columns: 82px minmax(0, 1fr) auto;
  }

  .order-item img,
  .order-item__empty {
    width: 82px;
  }

  .order-item__actions {
    grid-column: auto;
  }
}
</style>
