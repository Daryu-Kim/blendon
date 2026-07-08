<template>
  <main class="section page-shell">
    <div class="section-title">
      <div>
        <h1>주문서</h1>
        <p>상품 금액과 배송비를 확인한 뒤 결제 안내를 받을 수 있습니다.</p>
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
            </Select>
          </div>
          <div
            v-if="form.pickupType === 'store-pickup'"
            class="form-row store-pickup-row"
          >
            <label>매장 위치</label>
            <Button
              type="button"
              variant="ghost"
              :disabled="!settingsStore.global.storeMapUrl"
              @click="openStoreMap"
            >
              매장 위치 보기
            </Button>
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
              <Button type="button" variant="ghost" @click="openPostcode">
                주소 검색
              </Button>
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
            <Input
              id="address2"
              v-model="form.address.address2"
              placeholder="선택 입력"
            />
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
            <option value="transfer">계좌이체</option>
          </Select>
        </div>

        <div class="payment-guide">
          <strong>{{ paymentGuideTitle }}</strong>
          <p>{{ paymentGuideDescription }}</p>
          <dl v-if="form.paymentMethod === 'transfer'" class="account-info">
            <div>
              <dt>은행</dt>
              <dd>{{ settingsStore.global.depositBankName || "-" }}</dd>
            </div>
            <div>
              <dt>계좌번호</dt>
              <dd>{{ settingsStore.global.depositAccountNumber || "-" }}</dd>
            </div>
            <div>
              <dt>예금주</dt>
              <dd>{{ settingsStore.global.depositAccountHolder || "-" }}</dd>
            </div>
          </dl>
          <p class="deadline-note">
            결제 기한은 주문 접수 시점부터 24시간입니다.
          </p>
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

        <dl class="amounts">
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
          회원 등급 혜택가가 상품 금액에 반영되며, 일부 할인 제외 상품은
          제외됩니다.
        </p>
        <p v-if="error" class="error">{{ error }}</p>
        <Button
          type="submit"
          size="lg"
          :disabled="orderStore.loading || !cart.items.length"
        >
          주문 접수하기
        </Button>
      </aside>
    </form>
    <LoadingOverlay :show="orderStore.loading" label="주문 처리 중" />
  </main>
</template>

<script setup lang="ts">
import { formatCurrency } from "~/utils/format";
import type { CheckoutInput } from "~/stores/order";

definePageMeta({ middleware: "auth" });

const auth = useAuthStore();
const cart = useCartStore();
const orderStore = useOrderStore();
const productStore = useProductStore();
const settingsStore = useSiteSettingsStore();
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

const paymentGuideTitle = computed(() =>
  form.paymentMethod === "transfer" ? "계좌이체 안내" : "신용/체크카드 안내",
);
const paymentGuideDescription = computed(() =>
  form.paymentMethod === "transfer"
    ? "아래 사업자 계좌로 받는 분 이름과 동일한 이름으로 이체해주세요. 이름이 다르면 입금 확인이 늦어질 수 있습니다."
    : "SMS 결제로 진행됩니다. 영업시간 내에 문자로 결제 안내를 보내드립니다.",
);

const valueText = (value: string | number | null | undefined) =>
  String(value ?? "").trim();

const validateCheckoutForm = () => {
  if (!valueText(form.recipientName)) return "받는 분을 입력해 주세요.";
  if (!valueText(form.recipientPhone)) return "연락처를 입력해 주세요.";
  if (form.pickupType !== "delivery" && form.pickupType !== "store-pickup") {
    return "수령 방식을 선택해 주세요.";
  }
  if (form.pickupType === "delivery") {
    if (!valueText(form.address.zipCode)) return "우편번호를 입력해 주세요.";
    if (!valueText(form.address.address1)) return "주소를 입력해 주세요.";
  }
  return "";
};

const getErrorMessage = (e: unknown) => {
  if (e && typeof e === "object") {
    const errorObject = e as {
      data?: { statusMessage?: string; message?: string };
      statusMessage?: string;
      message?: string;
    };
    return (
      errorObject.data?.statusMessage ||
      errorObject.data?.message ||
      errorObject.statusMessage ||
      errorObject.message ||
      ""
    );
  }
  return "";
};

onMounted(async () => {
  cart.hydrate();
  await Promise.all([
    productStore.fetchCatalog(),
    settingsStore.fetchSettings(),
    orderStore.hydrate(),
  ]);
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

const openStoreMap = () => {
  const url = settingsStore.global.storeMapUrl;
  if (!url || !import.meta.client) return;
  window.open(url, "_blank", "noopener,noreferrer");
};

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
  const validationMessage = validateCheckoutForm();
  if (validationMessage) {
    error.value = validationMessage;
    return;
  }
  try {
    const order = await orderStore.createPendingOrder({
      ...form,
      pointUsed: clampedPointUsed.value,
    });
    cart.clear();
    await router.push(`/payment/complete?orderId=${order.id}`);
  } catch (e) {
    error.value = getErrorMessage(e) || "주문 처리에 실패했어요.";
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

.store-pickup-row {
  align-content: end;
}

.payment-guide {
  display: grid;
  gap: 8px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fbf8f1;
  padding: 12px;
}

.payment-guide strong {
  font-size: 15px;
}

.payment-guide p,
small,
.benefit-note {
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.55;
  word-break: keep-all;
}

.payment-guide p,
.benefit-note {
  margin: 0;
}

.deadline-note {
  font-weight: 900;
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

.account-info {
  border-top: 1px solid var(--color-line);
  padding-top: 8px;
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
    grid-template-columns: minmax(0, 1fr) 360px;
    align-items: start;
  }

  .inline-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
}
</style>
