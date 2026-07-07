<template>
  <main class="section page-shell">
    <section class="surface complete">
      <p class="eyebrow">ORDER RECEIVED</p>
      <h1>
        {{
          order?.paymentStatus === "paid"
            ? "결제가 확인되었습니다."
            : "주문이 접수되었습니다."
        }}
      </h1>
      <p v-if="order" class="order-summary">
        주문번호 {{ order.orderNo }} / 결제 예정 금액
        {{ formatCurrency(order.totalAmount) }}
      </p>

      <div v-if="order" class="payment-guide">
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

      <div class="actions">
        <Button to="/orders">주문 내역</Button>
        <Button to="/products" variant="ghost">상품 더 보기</Button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { PaymentMethod } from "~/types/domain";
import { formatCurrency, formatDate } from "~/utils/format";

const route = useRoute();
const orderStore = useOrderStore();
onMounted(() => orderStore.hydrate());
const order = computed(() =>
  orderStore.orders.find((item) => item.id === route.query.orderId),
);

const paymentMethodLabel = (method: PaymentMethod) =>
  method === "transfer" ? "계좌이체 안내" : "신용/체크카드 안내";

useHead({ title: "주문 접수" });
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

.order-summary {
  color: var(--color-muted);
}

.payment-guide {
  display: grid;
  gap: 10px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fbf8f1;
  padding: 14px;
  text-align: left;
}

.payment-guide p {
  color: var(--color-muted);
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: keep-all;
}

dl {
  display: grid;
  gap: 8px;
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
  font-weight: 900;
  text-align: right;
}

.deadline {
  font-weight: 900;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}
</style>
