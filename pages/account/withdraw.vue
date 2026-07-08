<template>
  <main class="section page-shell account-page">
    <section class="surface account-card">
      <p class="eyebrow">ACCOUNT</p>
      <h1>회원탈퇴</h1>
      <p class="intro">
        탈퇴 처리 후에는 같은 계정으로 로그인할 수 없습니다. 주문 및 결제
        처리에 필요한 기록은 관계 법령과 운영 기준에 따라 보관됩니다.
      </p>

      <form class="form-grid" @submit.prevent="submit">
        <div class="form-row">
          <label for="reason">탈퇴 사유</label>
          <Textarea
            id="reason"
            v-model="form.reason"
            placeholder="선택 입력"
          />
        </div>
        <div class="form-row">
          <label for="currentPassword">현재 비밀번호</label>
          <Input
            id="currentPassword"
            v-model="form.currentPassword"
            type="password"
            autocomplete="current-password"
            required
          />
        </div>
        <label class="confirm-row">
          <input v-model="confirmed" type="checkbox">
          <span>회원탈퇴 처리 내용을 확인했습니다.</span>
        </label>

        <p v-if="error" class="error">{{ error }}</p>

        <div class="actions">
          <Button
            type="submit"
            variant="danger"
            size="lg"
            :disabled="loading || !confirmed"
          >
            {{ loading ? "처리 중" : "회원탈퇴" }}
          </Button>
          <Button to="/mypage" variant="ghost">취소</Button>
        </div>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { toUserMessage } from "~/utils/error-message";

definePageMeta({ middleware: "auth" });

const auth = useAuthStore();
const router = useRouter();
const form = reactive({
  currentPassword: "",
  reason: "",
});
const confirmed = ref(false);
const loading = ref(false);
const error = ref("");

const submit = async () => {
  error.value = "";
  if (!confirmed.value) {
    error.value = "회원탈퇴 처리 내용을 확인해 주세요.";
    return;
  }
  if (!form.currentPassword) {
    error.value = "현재 비밀번호를 입력해 주세요.";
    return;
  }

  const firebase = useNuxtApp().$firebase;
  const token = await firebase.auth?.currentUser?.getIdToken();
  if (!token) {
    error.value = "로그인이 필요합니다.";
    return;
  }

  loading.value = true;
  try {
    await $fetch("/api/account/withdraw", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: {
        currentPassword: form.currentPassword,
        reason: form.reason,
      },
    });
    await auth.signOut();
    await router.push("/");
  } catch (e) {
    error.value = toUserMessage(e, "회원탈퇴 처리에 실패했습니다.");
  } finally {
    loading.value = false;
  }
};

useHead({ title: "회원탈퇴" });
</script>

<style scoped>
.account-page {
  display: grid;
  place-items: center;
  min-height: 64vh;
}

.account-card {
  display: grid;
  gap: 16px;
  width: min(560px, 100%);
  padding: 24px;
}

h1,
p {
  margin: 0;
}

.intro {
  color: var(--color-muted);
}

.confirm-row {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 800;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.error {
  color: var(--color-warning);
  font-weight: 900;
}
</style>
