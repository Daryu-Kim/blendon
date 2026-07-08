<template>
  <div class="cart-page">
    <EmptyState
      v-if="!cart.items.length"
      title="아직 담긴 상품이 없어요"
      description="상품 목록에서 마음에 드는 상품을 먼저 담아보세요."
      action-label="상품 보러가기"
      action-to="/products"
    />
    <template v-else>
      <div class="cart-list">
        <article
          v-for="item in detailedItems"
          :key="item.id"
          class="cart-item surface"
        >
          <NuxtLink
            class="cart-thumb"
            :to="productPath(item.product.slug)"
            :aria-label="`${item.product.name} 상세 보기`"
          >
            <img
              v-if="item.product.thumbnailUrl"
              :src="item.product.thumbnailUrl"
              :alt="item.product.name"
            />
            <div v-else class="cart-thumb__empty">
              {{ item.product.name }}
            </div>
          </NuxtLink>

          <div class="cart-info">
            <NuxtLink class="cart-title" :to="productPath(item.product.slug)">
              <h3>{{ item.product.name }}</h3>
            </NuxtLink>
            <ProductRatingSummary :product-id="item.product.id" />
            <p class="cart-option">{{ item.option.optionName }}</p>
            <PriceDisplay :product="item.product" :user="auth.profile" />
            <p v-if="item.product.isGradeDiscountExcluded" class="cart-note">
              등급 할인 제외 상품
            </p>
          </div>

          <div class="cart-side">
            <div class="cart-total">
              <span>상품금액</span>
              <strong>{{ formatCurrency(item.totalPrice) }}</strong>
            </div>
            <div class="cart-actions">
              <QuantityStepper
                :model-value="item.quantity"
                @update:model-value="cart.updateQuantity(item.id, $event)"
              />
              <button
                type="button"
                class="remove-button"
                :aria-label="`${item.product.name} 삭제`"
                title="삭제"
                @click="cart.remove(item.id)"
              >
                <Trash2 :size="17" aria-hidden="true" />
              </button>
            </div>
          </div>
        </article>
      </div>

      <aside class="summary surface">
        <h2>주문 요약</h2>
        <dl>
          <div>
            <dt>상품 금액</dt>
            <dd>{{ formatCurrency(cart.subtotal) }}</dd>
          </div>
          <div>
            <dt>배송비</dt>
            <dd>{{ formatCurrency(cart.deliveryFee) }}</dd>
          </div>
          <div class="total">
            <dt>결제 예정 금액</dt>
            <dd>{{ formatCurrency(cart.total) }}</dd>
          </div>
        </dl>
        <Button to="/checkout" size="lg">주문서 작성</Button>
      </aside>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Trash2 } from "@lucide/vue";
import { formatCurrency } from "~/utils/format";

const cart = useCartStore();
const auth = useAuthStore();
const productStore = useProductStore();
const settingsStore = useSiteSettingsStore();

type DetailedCartItem = NonNullable<(typeof cart.detailedItems)[number]>;

const detailedItems = computed<DetailedCartItem[]>(() =>
  cart.detailedItems.filter((item): item is DetailedCartItem => Boolean(item)),
);
const productPath = (slug: string) => `/products/${slug}`;

onMounted(async () => {
  cart.hydrate();
  await Promise.all([
    productStore.fetchCatalog(),
    settingsStore.fetchSettings(),
  ]);
});
</script>

<style scoped>
.cart-page {
  display: grid;
  gap: 18px;
}

.cart-list {
  display: grid;
  gap: 12px;
}

.cart-item {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
}

.cart-thumb {
  display: block;
  overflow: hidden;
  width: 92px;
  aspect-ratio: 1;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
}

.cart-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-thumb__empty {
  display: grid;
  height: 100%;
  place-items: center;
  padding: 8px;
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 900;
  line-height: 1.35;
  text-align: center;
  word-break: keep-all;
}

.cart-info {
  display: grid;
  min-width: 0;
  align-content: start;
  gap: 6px;
}

.cart-title {
  min-width: 0;
  color: var(--color-primary);
}

.cart-title h3 {
  margin: 0;
  font-size: 16px;
  line-height: 1.35;
  word-break: keep-all;
}

.cart-option {
  margin: 0;
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.35;
}

.cart-note {
  display: inline-flex;
  width: fit-content;
  margin: 0;
  border-radius: 999px;
  background: #f7efe1;
  color: #8d6b28;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 800;
}

.cart-side {
  grid-column: 1 / -1;
  display: grid;
  gap: 10px;
  border-top: 1px solid var(--color-line);
  padding-top: 12px;
}

.cart-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cart-total span {
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.cart-total strong {
  font-size: 18px;
}

.cart-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42px;
  align-items: center;
  gap: 8px;
}

.cart-actions :deep(.stepper) {
  width: 100%;
}

.remove-button {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  color: var(--color-warning);
  cursor: pointer;
}

.summary {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.summary h2 {
  margin: 0;
}

dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

dt {
  color: var(--color-muted);
}

dd {
  margin: 0;
  font-weight: 800;
}

.total {
  border-top: 1px solid var(--color-line);
  padding-top: 12px;
  font-size: 18px;
}

@media (min-width: 900px) {
  .cart-page {
    grid-template-columns: minmax(0, 1fr) 320px;
    align-items: start;
  }

  .cart-item {
    grid-template-columns: 112px minmax(0, 1fr) 190px;
    align-items: center;
    padding: 14px;
  }

  .cart-thumb {
    width: 112px;
  }

  .cart-side {
    grid-column: auto;
    border-top: 0;
    padding-top: 0;
  }
}
</style>
