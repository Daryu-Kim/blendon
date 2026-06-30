<template>
  <div class="cart-page">
    <EmptyState
      v-if="!cart.items.length"
      title="아직 담긴 상품이 없어요."
      description="오늘의 인기 상품에서 나에게 맞는 제품을 찾아보세요."
      action-label="인기 상품 보기"
      action-to="/products"
    />
    <template v-else>
      <div class="cart-list">
        <article v-for="item in cart.detailedItems" :key="item?.id" class="cart-item surface">
          <img :src="item?.product.thumbnailUrl" :alt="item?.product.name" >
          <div>
            <h3>{{ item?.product.name }}</h3>
            <p>{{ item?.option.optionName }}</p>
            <PriceDisplay v-if="item?.product" :product="item.product" :user="auth.profile" />
          </div>
          <div class="cart-actions">
            <QuantityStepper v-if="item" :model-value="item.quantity" @update:model-value="cart.updateQuantity(item.id, $event)" />
            <button v-if="item" type="button" @click="cart.remove(item.id)">삭제</button>
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
import { formatCurrency } from '~/utils/format'

const cart = useCartStore()
const auth = useAuthStore()
onMounted(() => cart.hydrate())
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

.cart-item img {
  width: 92px;
  height: 92px;
  border-radius: 8px;
  object-fit: cover;
}

.cart-item h3,
.cart-item p {
  margin: 0;
}

.cart-item p {
  margin-top: 4px;
  color: var(--color-muted);
}

.cart-actions {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cart-actions button {
  border: 0;
  background: transparent;
  color: var(--color-warning);
  font-weight: 800;
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
    grid-template-columns: 112px minmax(0, 1fr) auto;
    align-items: center;
  }

  .cart-item img {
    width: 112px;
    height: 112px;
  }

  .cart-actions {
    grid-column: auto;
    display: grid;
    justify-items: end;
  }
}
</style>
