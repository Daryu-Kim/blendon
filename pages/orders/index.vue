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
          <div>
            <span class="pill">{{ order.paymentStatus }}</span>
            <span class="pill">{{ order.deliveryStatus }}</span>
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
            >
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
import type { Order, OrderItem } from "~/types/domain";
import { formatCurrency, formatDate } from "~/utils/format";

definePageMeta({ middleware: "auth" });
const orderStore = useOrderStore();
const productStore = useProductStore();
const activeReviewKey = ref("");

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
