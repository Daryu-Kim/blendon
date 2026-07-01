<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>주문 관리</h1>
        <p>
          주문 검색, 결제 상태, 배송 상태, 취소/환불 요청 처리를 위한 기본
          화면입니다.
        </p>
      </div>
    </div>

    <AdminTable :rows="orders.orders" :columns="columns" row-key="id">
      <template #totalAmount="{ row }">{{
        formatCurrency(row.totalAmount)
      }}</template>
      <template #actions="{ row }">
        <div class="row-actions">
          <Select
            :model-value="row.orderStatus"
            @update:model-value="
              orders.setOrderStatus(row.id, $event as typeof row.orderStatus)
            "
          >
            <option value="pending">pending</option>
            <option value="confirmed">confirmed</option>
            <option value="preparing">preparing</option>
            <option value="completed">completed</option>
            <option value="canceled">canceled</option>
          </Select>
          <Select
            :model-value="row.deliveryStatus"
            @update:model-value="
              orders.setDeliveryStatus(
                row.id,
                $event as typeof row.deliveryStatus,
              )
            "
          >
            <option value="none">none</option>
            <option value="ready">ready</option>
            <option value="shipping">shipping</option>
            <option value="delivered">delivered</option>
            <option value="pickup-ready">pickup-ready</option>
            <option value="picked-up">picked-up</option>
          </Select>
        </div>
      </template>
    </AdminTable>
  </main>
</template>

<script setup lang="ts">
import { formatCurrency } from "~/utils/format";

definePageMeta({ layout: "admin", middleware: "admin" });
const orders = useOrderStore();
onMounted(() => orders.hydrate());
const columns = [
  { key: "orderNo", label: "주문번호" },
  { key: "recipientName", label: "수령인" },
  { key: "paymentStatus", label: "결제상태" },
  { key: "orderStatus", label: "주문상태" },
  { key: "deliveryStatus", label: "배송상태" },
  { key: "totalAmount", label: "금액" },
] as const;

useHead({ title: "관리자 주문 관리" });
</script>

<style scoped>
.row-actions {
  display: grid;
  grid-template-columns: 140px 160px;
  gap: 8px;
}
</style>
