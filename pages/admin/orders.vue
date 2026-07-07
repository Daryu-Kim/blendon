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
      <template #totalAmount="{ row }">
        {{ formatCurrency(row.totalAmount) }}
      </template>

      <template #trackingNumber="{ row }">
        <div class="tracking-readonly">
          <strong v-if="row.trackingNumber">
            {{ row.deliveryCompany || "택배" }}
          </strong>
          <span>{{ row.trackingNumber || "-" }}</span>
        </div>
      </template>

      <template #actions="{ row }">
        <div class="row-actions">
          <Select
            :model-value="row.paymentStatus"
            @update:model-value="
              orders.setPaymentStatus(row.id, $event as typeof row.paymentStatus)
            "
          >
            <option value="pending">pending</option>
            <option value="ready">ready</option>
            <option value="paid">paid</option>
            <option value="failed">failed</option>
            <option value="canceled">canceled</option>
            <option value="refunded">refunded</option>
          </Select>
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
          <div v-if="trackingDrafts[row.id]" class="tracking-controls">
            <Input
              v-model="trackingDrafts[row.id].deliveryCompany"
              placeholder="택배사"
            />
            <Input
              v-model="trackingDrafts[row.id].trackingNumber"
              placeholder="송장번호"
            />
            <Button size="sm" variant="ghost" @click="saveTracking(row)">
              저장
            </Button>
          </div>
        </div>
      </template>
    </AdminTable>
  </main>
</template>

<script setup lang="ts">
import type { Order } from "~/types/domain";
import { formatCurrency } from "~/utils/format";

definePageMeta({ layout: "admin", middleware: "admin" });

const orders = useOrderStore();

interface TrackingDraft {
  deliveryCompany: string;
  trackingNumber: string;
}

const trackingDrafts = reactive<Record<string, TrackingDraft>>({});

const syncTrackingDrafts = () => {
  orders.orders.forEach((order) => {
    trackingDrafts[order.id] = {
      deliveryCompany: order.deliveryCompany || "",
      trackingNumber: order.trackingNumber || "",
    };
  });
};

const saveTracking = async (order: Order) => {
  const draft = trackingDrafts[order.id];
  if (!draft) return;
  await orders.saveTrackingInfo(order.id, draft);
};

onMounted(async () => {
  await orders.fetchOrders(true);
  syncTrackingDrafts();
});

watch(
  () =>
    orders.orders.map(
      (order) =>
        `${order.id}:${order.deliveryCompany || ""}:${order.trackingNumber || ""}`,
    ),
  syncTrackingDrafts,
  { immediate: true },
);

const columns = [
  { key: "orderNo", label: "주문번호" },
  { key: "recipientName", label: "수령인" },
  { key: "paymentStatus", label: "결제상태" },
  { key: "orderStatus", label: "주문상태" },
  { key: "deliveryStatus", label: "배송상태" },
  { key: "trackingNumber", label: "송장" },
  { key: "totalAmount", label: "금액" },
] as const;

useHead({ title: "관리자 주문 관리" });
</script>

<style scoped>
.row-actions {
  display: grid;
  grid-template-columns: 140px 140px 160px minmax(320px, 1fr);
  gap: 8px;
}

.tracking-controls {
  display: grid;
  grid-template-columns: 120px minmax(150px, 1fr) auto;
  gap: 8px;
}

.tracking-readonly {
  display: grid;
  gap: 3px;
}

.tracking-readonly strong {
  font-size: 12px;
}

.tracking-readonly span {
  color: var(--color-muted);
}
</style>
