<template>
  <main class="section page-shell">
    <section class="surface complete">
      <p class="eyebrow">PAYMENT COMPLETE</p>
      <h1>{{ order?.paymentStatus === 'paid' ? '결제가 확인되었습니다.' : '주문 상태를 확인해 주세요.' }}</h1>
      <p v-if="order">주문번호 {{ order.orderNo }} / 결제금액 {{ formatCurrency(order.totalAmount) }}</p>
      <div class="actions">
        <Button to="/orders">주문 내역</Button>
        <Button to="/products" variant="ghost">상품 더 보기</Button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

const route = useRoute()
const orderStore = useOrderStore()
onMounted(() => orderStore.hydrate())
const order = computed(() => orderStore.orders.find((item) => item.id === route.query.orderId))
useHead({ title: '결제 완료' })
</script>

<style scoped>
.complete {
  display: grid;
  gap: 16px;
  padding: 28px;
  text-align: center;
}

h1,
p {
  margin: 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}
</style>
