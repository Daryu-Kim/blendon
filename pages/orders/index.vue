<template>
  <main class="section page-shell">
    <div class="section-title">
      <div>
        <h1>주문 내역</h1>
        <p>결제, 주문, 배송 상태를 확인합니다.</p>
      </div>
    </div>
    <div v-if="orderStore.myOrders.length" class="order-list">
      <article v-for="order in orderStore.myOrders" :key="order.id" class="surface order-card">
        <div>
          <strong>{{ order.orderNo }}</strong>
          <p>{{ formatDate(order.createdAt) }}</p>
        </div>
        <div>
          <span class="pill">{{ order.paymentStatus }}</span>
          <span class="pill">{{ order.deliveryStatus }}</span>
        </div>
        <strong>{{ formatCurrency(order.totalAmount) }}</strong>
      </article>
    </div>
    <EmptyState v-else title="주문 내역이 없어요." description="상품을 둘러보고 첫 주문을 시작해 보세요." action-label="상품 보기" action-to="/products" />
  </main>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate } from '~/utils/format'

definePageMeta({ middleware: 'auth' })
const orderStore = useOrderStore()
onMounted(() => orderStore.hydrate())
useHead({ title: '주문 내역' })
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

.order-card p {
  margin: 4px 0 0;
  color: var(--color-muted);
}

@media (min-width: 760px) {
  .order-card {
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
  }
}
</style>
