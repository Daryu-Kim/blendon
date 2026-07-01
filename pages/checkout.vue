<template>
  <main class="section page-shell">
    <div class="section-title">
      <div>
        <h1>주문서</h1>
        <p>서버에서 상품 가격과 재고를 다시 계산한 뒤 결제를 진행합니다.</p>
      </div>
    </div>

    <form class="checkout-grid" @submit.prevent="submit">
      <section class="surface form-panel">
        <h2>수령 정보</h2>
        <div class="form-grid">
          <div class="form-row">
            <label for="recipientName">받는 분</label>
            <Input id="recipientName" v-model="form.recipientName" required />
          </div>
          <div class="form-row">
            <label for="recipientPhone">연락처</label>
            <Input id="recipientPhone" v-model="form.recipientPhone" required />
          </div>
          <div class="form-row">
            <label for="pickupType">수령 방식</label>
            <Select id="pickupType" v-model="form.pickupType">
              <option value="delivery">배송</option>
              <option value="store-pickup">매장 픽업</option>
              <option value="lounge-pickup">라운지 픽업</option>
            </Select>
          </div>
          <div
            v-if="form.pickupType === 'delivery'"
            class="form-row postcode-row"
          >
            <label for="zipCode">우편번호</label>
            <div class="inline-row">
              <Input
                id="zipCode"
                v-model="form.address.zipCode"
                readonly
                required
              />
              <Button type="button" variant="ghost" @click="openPostcode"
                >주소 검색</Button
              >
            </div>
          </div>
          <div v-if="form.pickupType === 'delivery'" class="form-row">
            <label for="address1">주소</label>
            <Input
              id="address1"
              v-model="form.address.address1"
              readonly
              required
            />
          </div>
          <div v-if="form.pickupType === 'delivery'" class="form-row">
            <label for="address2">상세 주소</label>
            <Input id="address2" v-model="form.address.address2" required />
          </div>
          <div v-if="form.pickupType === 'delivery'" class="form-row">
            <label for="memo">배송 메모</label>
            <Textarea id="memo" v-model="form.deliveryMemo" />
          </div>
        </div>
      </section>
      <aside class="surface summary">
        <h2>결제 정보</h2>
        <div class="form-row">
          <label for="paymentMethod">결제수단</label>
          <Select id="paymentMethod" v-model="form.paymentMethod" required>
            <option value="card">신용/체크카드</option>
            <option value="transfer">실시간 계좌이체</option>
            <option value="virtual-account">가상계좌</option>
            <option value="mobile">휴대폰 결제</option>
            <option value="kakaopay">카카오페이</option>
            <option value="naverpay">네이버페이</option>
          </Select>
        </div>
        <div class="form-row">
          <label for="pointUsed">포인트 사용</label>
          <Input
            id="pointUsed"
            v-model="form.pointUsed"
            type="number"
            min="0"
            :max="maxPointUsable"
          />
          <small>최대 {{ formatCurrency(maxPointUsable) }}까지 사용 가능</small>
        </div>
        <dl>
          <div>
            <dt>상품 금액</dt>
            <dd>{{ formatCurrency(cart.subtotal) }}</dd>
          </div>
          <div>
            <dt>배송비</dt>
            <dd>{{ formatCurrency(checkoutDeliveryFee) }}</dd>
          </div>
          <div>
            <dt>포인트 사용</dt>
            <dd>-{{ formatCurrency(clampedPointUsed) }}</dd>
          </div>
          <div class="total">
            <dt>총 결제 금액</dt>
            <dd>{{ formatCurrency(totalAmount) }}</dd>
          </div>
        </dl>
        <p class="benefit-note">
          회원 등급 혜택가는 상품 금액에 반영되어 표시됩니다.
        </p>
        <p v-if="error" class="error">{{ error }}</p>
        <Button
          type="submit"
          size="lg"
          :disabled="orderStore.loading || !cart.items.length"
          >결제하기</Button
        >
      </aside>
    </form>
    <LoadingOverlay
      :show="orderStore.loading || payment.loading.value"
      label="주문 처리 중"
    />
  </main>
</template>

<script setup lang="ts">
import { formatCurrency } from "~/utils/format";
import type { CheckoutInput } from "~/stores/order";

definePageMeta({ middleware: "auth" });
const auth = useAuthStore();
const cart = useCartStore();
const orderStore = useOrderStore();
const payment = usePortOnePayment();
const router = useRouter();
const error = ref("");

const form = reactive<CheckoutInput>({
  recipientName: auth.profile?.displayName || "",
  recipientPhone: auth.profile?.phoneNumber || "",
  address: auth.profile?.defaultAddress || {
    zipCode: "",
    address1: "",
    address2: "",
  },
  deliveryMemo: "",
  pickupType: "delivery",
  pointUsed: 0,
  paymentMethod: "card",
});

const checkoutDeliveryFee = computed(() =>
  form.pickupType === "delivery" ? cart.deliveryFee : 0,
);
const checkoutBaseAmount = computed(
  () => cart.subtotal + checkoutDeliveryFee.value,
);
const maxPointUsable = computed(() =>
  Math.min(
    auth.profile?.availablePoint || 0,
    Math.floor(checkoutBaseAmount.value * 0.1),
  ),
);
const clampedPointUsed = computed(() =>
  Math.min(Number(form.pointUsed || 0), maxPointUsable.value),
);
const totalAmount = computed(() =>
  Math.max(0, checkoutBaseAmount.value - clampedPointUsed.value),
);

onMounted(() => {
  cart.hydrate();
  orderStore.hydrate();
});

watch(
  () => form.pointUsed,
  () => {
    form.pointUsed = clampedPointUsed.value;
  },
);

watch(
  () => form.pickupType,
  (pickupType) => {
    if (pickupType !== "delivery") {
      form.address = { zipCode: "", address1: "", address2: "" };
      form.deliveryMemo = "";
    }
  },
);

const loadDaumPostcode = () =>
  new Promise<void>((resolve, reject) => {
    if (!import.meta.client)
      return reject(
        new Error("브라우저에서만 주소 검색을 사용할 수 있습니다."),
      );
    const win = window as Window & {
      daum?: {
        Postcode: new (options: {
          oncomplete: (data: {
            zonecode: string;
            roadAddress: string;
            jibunAddress: string;
          }) => void;
        }) => { open: () => void };
      };
    };
    if (win.daum?.Postcode) return resolve();
    const script = document.createElement("script");
    script.src =
      "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("주소 검색 스크립트를 불러오지 못했습니다."));
    document.head.append(script);
  });

const openPostcode = async () => {
  await loadDaumPostcode();
  const win = window as unknown as Window & {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: {
          zonecode: string;
          roadAddress: string;
          jibunAddress: string;
        }) => void;
      }) => { open: () => void };
    };
  };
  new win.daum.Postcode({
    oncomplete: (data) => {
      form.address.zipCode = data.zonecode;
      form.address.address1 = data.roadAddress || data.jibunAddress;
    },
  }).open();
};

const submit = async () => {
  error.value = "";
  try {
    const order = await orderStore.createPendingOrder(form);
    const paymentResult = await payment.requestPayment(order);
    if ("code" in paymentResult && paymentResult.code)
      throw new Error(paymentResult.message || "결제가 완료되지 않았습니다.");
    const paymentId =
      "paymentId" in paymentResult && paymentResult.paymentId
        ? paymentResult.paymentId
        : order.paymentId || order.portonePaymentId || "";
    const verifiedOrder = await orderStore.verifyPayment(order.id, paymentId);
    if (verifiedOrder.paymentStatus !== "paid")
      throw new Error("결제 검증에 실패했습니다.");
    cart.clear();
    await router.push(`/payment/complete?orderId=${verifiedOrder.id}`);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "주문 처리에 실패했어요.";
  }
};

useHead({ title: "주문서" });
</script>

<style scoped>
.checkout-grid {
  display: grid;
  gap: 18px;
}

.form-panel,
.summary {
  display: grid;
  gap: 16px;
  padding: 20px;
}

.inline-row {
  display: grid;
  gap: 8px;
}

small,
.benefit-note {
  color: var(--color-muted);
  font-size: 13px;
}

.benefit-note {
  margin: 0;
  font-weight: 700;
}

h2 {
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
}

dd {
  margin: 0;
  font-weight: 900;
}

.total {
  border-top: 1px solid var(--color-line);
  padding-top: 12px;
}

.error {
  margin: 0;
  color: var(--color-warning);
  font-weight: 800;
}

@media (min-width: 900px) {
  .checkout-grid {
    grid-template-columns: minmax(0, 1fr) 340px;
    align-items: start;
  }

  .inline-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
}
</style>
