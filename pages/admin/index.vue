<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>관리자 대시보드</h1>
        <p>주문, 매출, 재고, 회원 인증 상태를 한눈에 확인합니다.</p>
      </div>
    </div>

    <section class="metric-grid">
      <article class="metric surface"><span>오늘 주문 수</span><strong>{{ dashboard.todayOrderCount }}</strong></article>
      <article class="metric surface"><span>오늘 매출</span><strong>{{ formatCurrency(dashboard.todayRevenue) }}</strong></article>
      <article class="metric surface"><span>결제 대기</span><strong>{{ dashboard.pendingPaymentCount }}</strong></article>
      <article class="metric surface"><span>배송 준비</span><strong>{{ dashboard.preparingDeliveryCount }}</strong></article>
      <article class="metric surface"><span>품절 임박</span><strong>{{ dashboard.lowStockProducts.length }}</strong></article>
      <article class="metric surface"><span>신규 회원</span><strong>{{ dashboard.newUserCount }}</strong></article>
      <article class="metric surface"><span>성인 인증 회원</span><strong>{{ dashboard.adultVerifiedCount }}</strong></article>
    </section>

    <section class="surface panel">
      <h2>최근 주문</h2>
      <AdminTable :rows="dashboard.recentOrders" :columns="orderColumns" row-key="id">
        <template #totalAmount="{ row }">{{ formatCurrency(row.totalAmount) }}</template>
        <template #createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
      </AdminTable>
    </section>
  </main>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate } from '~/utils/format'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const admin = useAdminStore()
const orders = useOrderStore()
const products = useProductStore()
onMounted(async () => {
  orders.hydrate()
  await products.fetchCatalog()
})
const dashboard = computed(() => admin.dashboard)
const orderColumns = [
  { key: 'orderNo', label: '주문번호' },
  { key: 'recipientName', label: '수령인' },
  { key: 'paymentStatus', label: '결제' },
  { key: 'deliveryStatus', label: '배송' },
  { key: 'totalAmount', label: '금액' },
  { key: 'createdAt', label: '일시' }
] as const

useHead({ title: '관리자 대시보드' })
</script>

<style scoped>
.panel {
  display: grid;
  gap: 14px;
  padding: 18px;
}

h2 {
  margin: 0;
}
</style>
