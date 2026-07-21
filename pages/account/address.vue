<template>
  <main class="section page-shell address-page">
    <section class="surface address-card">
      <div class="address-head">
        <div>
          <p class="eyebrow">DELIVERY</p>
          <h1>기본 배송지 관리</h1>
          <p>
            저장한 정보는 주문서의 받는 분, 연락처, 배송 주소에 자동으로
            채워집니다.
          </p>
        </div>
        <Button to="/mypage" variant="ghost">마이페이지</Button>
      </div>

      <form class="address-form" @submit.prevent="submit">
        <section class="form-section">
          <h2>수령 정보</h2>
          <div class="form-grid">
            <div class="form-row">
              <label for="displayName">받는 분</label>
              <Input id="displayName" v-model="form.displayName" required />
            </div>
            <div class="form-row">
              <label for="phoneNumber">연락처</label>
              <Input
                id="phoneNumber"
                v-model="form.phoneNumber"
                inputmode="tel"
                required
              />
            </div>
          </div>
        </section>

        <section class="form-section">
          <h2>배송 주소</h2>
          <div class="form-grid">
            <div class="form-row">
              <label for="zipCode">우편번호</label>
              <div class="inline-row">
                <Input id="zipCode" v-model="form.address.zipCode" readonly />
                <Button type="button" variant="ghost" @click="openPostcode">
                  주소 검색
                </Button>
              </div>
            </div>
            <div class="form-row wide">
              <label for="address1">주소</label>
              <Input id="address1" v-model="form.address.address1" readonly />
            </div>
            <div class="form-row wide">
              <label for="address2">상세 주소</label>
              <Input
                id="address2"
                v-model="form.address.address2"
                placeholder="동/호수 등 선택 입력"
              />
            </div>
          </div>
        </section>

        <p v-if="error" class="error">{{ error }}</p>

        <div class="actions">
          <Button type="submit" size="lg" :disabled="loading">
            {{ loading ? "저장 중" : "배송지 저장" }}
          </Button>
          <Button
            type="button"
            variant="ghost"
            :disabled="loading"
            @click="clearAddress"
          >
            주소 비우기
          </Button>
        </div>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { Address } from "~/types/domain";
import { toUserMessage } from "~/utils/error-message";

definePageMeta({ middleware: "auth" });

const auth = useAuthStore();
const toast = useToast();
const loading = ref(false);
const error = ref("");
const emptyAddress = (): Address => ({
  zipCode: "",
  address1: "",
  address2: "",
});
const form = reactive({
  displayName: "",
  phoneNumber: "",
  address: emptyAddress(),
});

const applyProfile = () => {
  form.displayName = auth.profile?.displayName || "";
  form.phoneNumber = auth.profile?.phoneNumber || "";
  form.address = auth.profile?.defaultAddress
    ? { ...auth.profile.defaultAddress }
    : emptyAddress();
};

watch(() => auth.profile, applyProfile, { immediate: true });

const valueText = (value: string | number | null | undefined) =>
  String(value ?? "").trim();

const validate = () => {
  if (!valueText(form.displayName)) return "받는 분을 입력해 주세요.";
  if (!valueText(form.phoneNumber)) return "연락처를 입력해 주세요.";
  if (!valueText(form.address.zipCode)) return "주소 검색으로 우편번호를 입력해 주세요.";
  if (!valueText(form.address.address1)) return "주소 검색으로 주소를 입력해 주세요.";
  return "";
};

const loadDaumPostcode = () =>
  new Promise<void>((resolve, reject) => {
    if (!import.meta.client) {
      reject(new Error("브라우저에서만 주소 검색을 사용할 수 있습니다."));
      return;
    }

    const win = window as unknown as Window & {
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
    if (win.daum?.Postcode) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("주소 검색 스크립트를 불러오지 못했습니다."));
    document.head.append(script);
  });

const openPostcode = async () => {
  try {
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
  } catch (e) {
    error.value = toUserMessage(e, "주소 검색을 사용할 수 없습니다.");
  }
};

const clearAddress = () => {
  form.address = emptyAddress();
};

const submit = async () => {
  error.value = "";
  const validationMessage = validate();
  if (validationMessage) {
    error.value = validationMessage;
    return;
  }

  loading.value = true;
  try {
    await auth.saveProfile({
      displayName: valueText(form.displayName),
      phoneNumber: valueText(form.phoneNumber),
      defaultAddress: {
        zipCode: valueText(form.address.zipCode),
        address1: valueText(form.address.address1),
        address2: valueText(form.address.address2),
      },
    });
    toast.show("기본 배송지를 저장했습니다.", "success");
  } catch (e) {
    error.value = toUserMessage(e, "기본 배송지 저장에 실패했습니다.");
  } finally {
    loading.value = false;
  }
};

useHead({ title: "기본 배송지 관리" });
</script>

<style scoped>
.address-page {
  display: grid;
  place-items: start center;
  min-height: calc(100svh - var(--header-height) - 72px);
}

.address-card {
  display: grid;
  gap: 22px;
  width: min(760px, 100%);
  padding: 22px;
}

.address-head {
  display: grid;
  gap: 14px;
}

.address-head h1,
.address-head p,
.form-section h2 {
  margin: 0;
}

.address-head h1 {
  font-size: clamp(26px, 4vw, 38px);
  line-height: 1.12;
}

.address-head > div > p:last-child {
  margin-top: 8px;
  color: var(--color-muted);
  line-height: 1.6;
}

.address-form,
.form-section {
  display: grid;
  gap: 16px;
}

.form-section {
  border-top: 1px solid var(--color-line);
  padding-top: 18px;
}

.form-section h2 {
  font-size: 18px;
}

.inline-row {
  display: grid;
  gap: 8px;
}

.wide {
  grid-column: 1 / -1;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.error {
  margin: 0;
  color: var(--color-warning);
  font-weight: 900;
}

@media (min-width: 720px) {
  .address-head {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .inline-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
}
</style>
