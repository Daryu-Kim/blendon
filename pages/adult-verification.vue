<template>
  <main class="section page-shell verification-page">
    <section class="surface verification-card">
      <p class="eyebrow">ADULT MEMBER</p>
      <h1>성인 회원 확인이 필요해요.</h1>
      <p>{{ brand.name }}은 주민등록증 진위확인으로 성인 여부를 확인합니다.</p>
      <form class="form-grid" @submit.prevent="submit">
        <div class="form-row">
          <label for="name">이름</label>
          <Input id="name" v-model="form.name" autocomplete="name" required />
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
        <p class="muted">
          입력한 주민등록증 정보는 진위확인에만 사용하며 저장하지 않습니다.
        </p>
        <p v-if="error || verifier.error.value" class="error">
          {{ error || verifier.error.value }}
        </p>
        <Button type="submit" size="lg" :disabled="verifier.loading.value">
          {{ verifier.loading.value ? "확인 중" : "확인 진행" }}
        </Button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
const { brand } = useAppConfig();
const auth = useAuthStore();
const verifier = useAdultVerification();
const router = useRouter();
const form = reactive({
  name: "",
  rrn1: "",
  rrn2: "",
  issueDate: "",
});
const error = ref("");
const digitsOnly = (value: string) => value.replace(/\D/g, "");

const submit = async () => {
  error.value = "";
  if (!auth.profile) {
    await router.push("/login?redirect=/adult-verification");
    return;
  }
  const rrn1 = digitsOnly(form.rrn1);
  const rrn2 = digitsOnly(form.rrn2);
  const issueDate = digitsOnly(form.issueDate);
  if (!form.name.trim()) {
    error.value = "이름을 입력해 주세요.";
    return;
  }
  if (!/^\d{6}$/.test(rrn1) || !/^\d{7}$/.test(rrn2)) {
    error.value = "주민등록번호를 정확히 입력해 주세요.";
    return;
  }
  if (!/^\d{8}$/.test(issueDate)) {
    error.value = "주민등록증 발급일자를 8자리로 입력해 주세요.";
    return;
  }
  try {
    await verifier.verifyWithIdentityCard({
      name: form.name.trim(),
      rrn1,
      rrn2,
      issueDate,
    });
    await router.push("/mypage");
  } catch {
    // The composable exposes a user-facing message through verifier.error.
  }
};

onMounted(async () => {
  await auth.init();
  form.name = auth.profile?.displayName || "";
  if (auth.isAdultVerified) await router.push("/mypage");
});

useHead({ title: "성인 회원 확인" });
</script>

<style scoped>
.verification-page {
  display: grid;
  place-items: center;
}

.verification-card {
  display: grid;
  gap: 18px;
  width: min(620px, 100%);
  padding: 26px;
}

h1,
p {
  margin: 0;
}

.success {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  background: #e7f0ea;
  padding: 14px;
  font-weight: 900;
}

.error {
  color: var(--color-warning);
  font-weight: 800;
}
</style>
