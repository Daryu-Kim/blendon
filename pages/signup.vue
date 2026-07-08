<template>
  <main class="section page-shell signup-page">
    <section class="signup-shell">
      <header class="signup-header">
        <p class="eyebrow">JOIN</p>
        <h1>회원가입</h1>
        <p>본인확인 후 계정 정보를 입력해 주세요.</p>
      </header>

      <form class="signup-form" @submit.prevent="submit">
        <section class="surface form-section">
          <div class="section-heading">
            <span>01</span>
            <div>
              <h2>본인확인</h2>
              <p>주민등록증 진위확인 후 성인 회원만 가입할 수 있습니다.</p>
            </div>
          </div>

          <div class="form-grid two-fields">
            <div class="form-row">
              <label for="displayName">이름</label>
              <Input
                id="displayName"
                v-model="form.displayName"
                autocomplete="name"
                required
              />
            </div>
            <div class="form-row">
              <label for="phoneNumber">휴대폰 번호</label>
              <Input
                id="phoneNumber"
                v-model="form.phoneNumber"
                inputmode="tel"
                placeholder="010-0000-0000"
                required
              />
            </div>
            <div class="form-row">
              <label for="rrn1">주민등록번호 앞 6자리</label>
              <Input
                id="rrn1"
                v-model="form.rrn1"
                inputmode="numeric"
                maxlength="6"
                autocomplete="off"
                required
              />
            </div>
            <div class="form-row">
              <label for="rrn2">주민등록번호 뒤 7자리</label>
              <Input
                id="rrn2"
                v-model="form.rrn2"
                type="password"
                inputmode="numeric"
                maxlength="7"
                autocomplete="off"
                required
              />
            </div>
            <div class="form-row">
              <label for="issueDate">주민등록증 발급일자</label>
              <Input
                id="issueDate"
                v-model="form.issueDate"
                inputmode="numeric"
                maxlength="8"
                placeholder="YYYYMMDD"
                autocomplete="off"
                required
              />
            </div>
          </div>
          <p class="field-help">
            입력한 주민등록증 정보는 진위확인에만 사용하며 저장하지 않습니다.
          </p>
          <div class="verify-action">
            <Button
              type="button"
              variant="secondary"
              :disabled="verificationLoading"
              @click="verifyAdult"
            >
              {{ verificationButtonText }}
            </Button>
            <p
              v-if="verificationMessage"
              :class="verificationToken ? 'success' : 'error'"
            >
              {{ verificationMessage }}
            </p>
          </div>
        </section>

        <section class="surface form-section">
          <div class="section-heading">
            <span>02</span>
            <div>
              <h2>계정 정보</h2>
              <p>로그인에 사용할 아이디와 비밀번호를 입력합니다.</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-row">
              <label for="loginId">아이디</label>
              <Input
                id="loginId"
                v-model="form.loginId"
                autocomplete="username"
                placeholder="영문/숫자 4자 이상"
                required
              />
            </div>
            <div class="form-row">
              <label for="email">이메일</label>
              <Input
                id="email"
                v-model="form.email"
                type="email"
                autocomplete="email"
                required
              />
            </div>
            <div class="form-row">
              <label for="password">비밀번호</label>
              <Input
                id="password"
                v-model="form.password"
                type="password"
                autocomplete="new-password"
                required
                minlength="6"
              />
            </div>
            <div class="form-row">
              <label for="passwordConfirm">비밀번호 확인</label>
              <Input
                id="passwordConfirm"
                v-model="passwordConfirm"
                type="password"
                autocomplete="new-password"
                required
                minlength="6"
              />
            </div>
          </div>
        </section>

        <section class="surface form-section">
          <div class="section-heading">
            <span>03</span>
            <div>
              <h2>약관 동의</h2>
              <p>필수 약관에 동의해야 가입할 수 있습니다.</p>
            </div>
          </div>

          <div class="terms-box">
            <label class="check-row all">
              <input v-model="allTerms" type="checkbox" />
              <span>전체 동의</span>
            </label>
            <div class="check-row with-action">
              <label>
                <input v-model="terms.service" type="checkbox" required />
                <span>[필수] 이용약관 동의</span>
              </label>
              <button type="button" @click="openPolicy('terms')">보기</button>
            </div>
            <div class="check-row with-action">
              <label>
                <input v-model="terms.privacy" type="checkbox" required />
                <span>[필수] 개인정보 수집 및 이용 동의</span>
              </label>
              <button type="button" @click="openPolicy('privacy')">보기</button>
            </div>
            <div class="check-row with-action">
              <label>
                <input v-model="terms.refund" type="checkbox" required />
                <span>[필수] 취소/환불 정책 확인</span>
              </label>
              <button type="button" @click="openPolicy('refund')">보기</button>
            </div>
            <div class="check-row with-action">
              <label>
                <input v-model="terms.marketing" type="checkbox" />
                <span>[선택] 이벤트 및 혜택 안내 수신 동의</span>
              </label>
              <button type="button" @click="openPolicy('marketing')">
                보기
              </button>
            </div>
            <div class="check-row with-action">
              <label>
                <input v-model="terms.nightMarketing" type="checkbox" />
                <span>[선택] 심야 알림 수신 동의</span>
              </label>
              <button type="button" @click="openPolicy('nightMarketing')">
                보기
              </button>
            </div>
          </div>
        </section>

        <p v-if="error" class="error">{{ error }}</p>
        <div class="submit-row">
          <Button type="submit" size="lg" :disabled="loading">
            {{ loading ? "가입 중" : "가입하기" }}
          </Button>
          <NuxtLink to="/login">이미 계정이 있어요</NuxtLink>
        </div>
      </form>
    </section>

    <Modal
      :open="Boolean(activePolicy)"
      :title="activePolicyTitle"
      @close="activePolicy = null"
    >
      <div class="policy-modal">
        <p>시행일: {{ legalConfig.effectiveDate }}</p>
        <section v-for="section in activePolicySections" :key="section.title">
          <h3>{{ section.title }}</h3>
          <p>{{ section.body }}</p>
        </section>
      </div>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import type { SignUpProfileInput } from "~/stores/auth";
import { legalConfig } from "~/config/legal";
import { toUserMessage } from "~/utils/error-message";

const auth = useAuthStore();
const router = useRouter();

const form = reactive({
  loginId: "",
  email: "",
  password: "",
  displayName: "",
  phoneNumber: "",
  rrn1: "",
  rrn2: "",
  issueDate: "",
});
const passwordConfirm = ref("");
const terms = reactive({
  service: false,
  privacy: false,
  refund: false,
  marketing: false,
  nightMarketing: false,
});
const error = ref("");
const loading = ref(false);
const verificationLoading = ref(false);
const verificationToken = ref("");
const verificationMessage = ref("");
const verificationButtonText = computed(() => {
  if (verificationLoading.value) return "확인 중";
  if (verificationToken.value) return "다시 인증하기";
  return "성인 인증하기";
});

const allTerms = computed({
  get: () =>
    terms.service &&
    terms.privacy &&
    terms.refund &&
    terms.marketing &&
    terms.nightMarketing,
  set: (checked: boolean) => {
    terms.service = checked;
    terms.privacy = checked;
    terms.refund = checked;
    terms.marketing = checked;
    terms.nightMarketing = checked;
  },
});

type PolicyKey =
  "terms" | "privacy" | "refund" | "marketing" | "nightMarketing";

const activePolicy = ref<PolicyKey | null>(null);

const policyTitles: Record<PolicyKey, string> = {
  terms: "이용약관",
  privacy: "개인정보 수집 및 이용",
  refund: "취소/환불 정책",
  marketing: "이벤트 및 혜택 안내 수신 동의",
  nightMarketing: "심야 알림 수신 동의",
};

const activePolicyTitle = computed(() =>
  activePolicy.value ? policyTitles[activePolicy.value] : "",
);
const activePolicySections = computed(() => {
  if (activePolicy.value === "terms") return legalConfig.terms;
  if (activePolicy.value === "privacy") return legalConfig.privacy;
  if (activePolicy.value === "refund") return legalConfig.refundPolicy;
  if (activePolicy.value === "marketing") return legalConfig.marketing;
  if (activePolicy.value === "nightMarketing")
    return legalConfig.nightMarketing;
  return [];
});

const openPolicy = (key: PolicyKey) => {
  activePolicy.value = key;
};

const requiredTermsAccepted = computed(
  () => terms.service && terms.privacy && terms.refund,
);

const digitsOnly = (value: string) => value.replace(/\D/g, "");

watch(
  () => [form.displayName, form.rrn1, form.rrn2, form.issueDate],
  () => {
    if (!verificationToken.value) return;
    verificationToken.value = "";
    verificationMessage.value =
      "인증 정보가 변경되었습니다. 다시 인증해 주세요.";
  },
);

const verifyAdult = async () => {
  error.value = "";
  verificationMessage.value = "";
  const rrn1 = digitsOnly(form.rrn1);
  const rrn2 = digitsOnly(form.rrn2);
  const issueDate = digitsOnly(form.issueDate);

  if (!form.displayName.trim()) {
    verificationMessage.value = "이름을 입력해 주세요.";
    return;
  }
  if (!/^\d{6}$/.test(rrn1) || !/^\d{7}$/.test(rrn2)) {
    verificationMessage.value = "주민등록번호를 정확히 입력해 주세요.";
    return;
  }
  if (!/^\d{8}$/.test(issueDate)) {
    verificationMessage.value = "주민등록증 발급일자를 8자리로 입력해 주세요.";
    return;
  }

  verificationLoading.value = true;
  try {
    const result = await $fetch<{
      ok: boolean;
      message?: string;
      verificationToken: string;
      expiresAt: string;
    }>("/api/auth/signup-verification", {
      method: "POST",
      body: {
        name: form.displayName.trim(),
        rrn1,
        rrn2,
        issueDate,
      },
    });
    if (!result.ok || !result.verificationToken) {
      verificationMessage.value =
        result.message ||
        "성인 인증에 실패했어요. 입력한 정보를 다시 확인해 주세요.";
      return;
    }

    verificationToken.value = result.verificationToken;
    const expiresAt = new Date(result.expiresAt);
    const expiresText = Number.isNaN(expiresAt.getTime())
      ? "30분 안에"
      : `${expiresAt.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        })}까지`;
    verificationMessage.value = `성인 인증이 완료되었습니다. ${expiresText} 가입을 완료해 주세요.`;
  } catch (e) {
    verificationToken.value = "";
    verificationMessage.value = toUserMessage(
      e,
      "성인 인증에 실패했어요. 입력한 정보를 다시 확인해 주세요.",
    );
  } finally {
    verificationLoading.value = false;
  }
};

const submit = async () => {
  error.value = "";
  if (!form.displayName.trim() || !form.phoneNumber.trim()) {
    error.value = "이름과 휴대폰 번호를 입력해 주세요.";
    return;
  }
  if (!verificationToken.value) {
    error.value = "성인 인증을 먼저 완료해 주세요.";
    return;
  }
  if (!/^[a-zA-Z0-9._-]{4,30}$/.test(form.loginId)) {
    error.value =
      "아이디는 영문, 숫자, 일부 기호 포함 4자 이상으로 입력해 주세요.";
    return;
  }
  if (form.password !== passwordConfirm.value) {
    error.value = "비밀번호가 일치하지 않습니다.";
    return;
  }
  if (!requiredTermsAccepted.value) {
    error.value = "필수 약관에 동의해 주세요.";
    return;
  }

  loading.value = true;
  try {
    const agreedAt = new Date().toISOString();
    const consent = (accepted: boolean) => ({
      accepted,
      agreedAt: accepted ? agreedAt : null,
    });
    const profileInput: SignUpProfileInput = {
      loginId: form.loginId,
      email: form.email,
      displayName: form.displayName,
      phoneNumber: form.phoneNumber,
      termsAgreement: {
        service: consent(terms.service),
        privacy: consent(terms.privacy),
        refund: consent(terms.refund),
        marketing: consent(terms.marketing),
        nightMarketing: consent(terms.nightMarketing),
        agreedAt,
      },
    };

    await auth.signUp(
      form.email,
      form.password,
      form.displayName,
      profileInput,
      verificationToken.value,
    );
    await router.push("/mypage");
  } catch (e) {
    error.value =
      auth.error ||
      toUserMessage(
        e,
        "회원가입에 실패했어요. 입력한 정보를 다시 확인해 주세요.",
      );
  } finally {
    loading.value = false;
  }
};

useHead({ title: "회원가입" });
</script>

<style scoped>
.signup-page {
  display: grid;
  justify-items: center;
}

.signup-shell {
  display: grid;
  gap: 20px;
  width: min(760px, 100%);
}

.signup-header {
  text-align: center;
}

.signup-header h1,
.signup-header p {
  margin: 0;
}

.signup-header p:not(.eyebrow) {
  margin-top: 8px;
  color: var(--color-muted);
}

.signup-form {
  display: grid;
  gap: 16px;
}

.form-section {
  display: grid;
  gap: 18px;
  padding: 20px;
}

.section-heading {
  display: flex;
  gap: 12px;
  align-items: start;
}

.section-heading > span {
  display: grid;
  min-width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-weight: 900;
}

.section-heading h2,
.section-heading p {
  margin: 0;
}

.section-heading p {
  margin-top: 4px;
  color: var(--color-muted);
}

.verify-action {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.verify-action p {
  margin: 0;
}

.terms-box {
  display: grid;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
}

.check-row {
  display: flex;
  min-height: 46px;
  align-items: center;
  gap: 10px;
  border-top: 1px solid var(--color-line);
  padding: 0 14px;
  font-weight: 700;
}

.check-row.with-action {
  justify-content: space-between;
  padding-right: 10px;
}

.check-row.with-action label {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.check-row.with-action span {
  line-height: 1.35;
}

.check-row.with-action button {
  flex: 0 0 auto;
  border: 1px solid var(--color-line);
  border-radius: 999px;
  background: #fff;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 900;
  padding: 7px 11px;
}

.check-row:first-child {
  border-top: 0;
}

.check-row.all {
  background: #fbf5e9;
  font-weight: 900;
}

.check-row input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

.success,
.error {
  margin: 0;
  font-weight: 800;
}

.success {
  color: #497a5b;
}

.error {
  color: var(--color-warning);
}

.submit-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.submit-row a {
  color: var(--color-muted);
  font-weight: 800;
}

.policy-modal {
  display: grid;
  gap: 18px;
}

.policy-modal > p,
.policy-modal section p,
.policy-modal section h3 {
  margin: 0;
}

.policy-modal > p {
  color: var(--color-muted);
  font-weight: 800;
}

.policy-modal section {
  display: grid;
  gap: 7px;
}

.policy-modal h3 {
  font-size: 16px;
}

.policy-modal section p {
  color: var(--color-muted);
  line-height: 1.75;
}

@media (min-width: 700px) {
  .two-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
