<template>
  <main class="section page-shell account-page">
    <section class="surface account-card">
      <p class="eyebrow">ACCOUNT</p>
      <h1>비밀번호 변경</h1>
      <p class="intro">
        현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.
      </p>

      <form class="form-grid" @submit.prevent="submit">
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
        <div class="form-row">
          <label for="newPassword">새 비밀번호</label>
          <Input
            id="newPassword"
            v-model="form.newPassword"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
          />
        </div>
        <div class="form-row">
          <label for="newPasswordConfirm">새 비밀번호 확인</label>
          <Input
            id="newPasswordConfirm"
            v-model="form.newPasswordConfirm"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
          />
        </div>

        <p v-if="auth.profile?.mustChangePassword" class="notice">
          임시 비밀번호로 로그인한 계정입니다. 계속 이용하려면 비밀번호를
          먼저 변경해 주세요.
        </p>
        <p v-if="message" class="success">{{ message }}</p>
        <p v-if="error" class="error">{{ error }}</p>

        <div class="actions">
          <Button type="submit" size="lg" :disabled="loading">
            {{ loading ? "변경 중" : "비밀번호 변경" }}
          </Button>
          <Button
            v-if="!auth.profile?.mustChangePassword"
            to="/mypage"
            variant="ghost"
          >
            마이페이지
          </Button>
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
const route = useRoute();
const toast = useToast();
const form = reactive({
  currentPassword: "",
  newPassword: "",
  newPasswordConfirm: "",
});
const loading = ref(false);
const error = ref("");
const message = ref("");

const submit = async () => {
  error.value = "";
  message.value = "";
  if (form.newPassword.length < 8) {
    error.value = "새 비밀번호는 8자 이상으로 입력해 주세요.";
    return;
  }
  if (form.newPassword !== form.newPasswordConfirm) {
    error.value = "새 비밀번호가 일치하지 않습니다.";
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
    await $fetch("/api/account/change-password", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      },
    });
    await auth.refreshProfile();
    auth.applyLocalProfileUpdates({
      mustChangePassword: false,
      passwordChangedAt: new Date().toISOString(),
    });
    toast.show("비밀번호를 변경했습니다.", "success");
    const redirect = String(route.query.redirect || "/mypage");
    await router.push(
      redirect === "/account/change-password" ? "/mypage" : redirect,
    );
  } catch (e) {
    error.value = toUserMessage(e, "비밀번호 변경에 실패했습니다.");
  } finally {
    loading.value = false;
  }
};

useHead({ title: "비밀번호 변경" });
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
  width: min(520px, 100%);
  padding: 24px;
}

h1,
p {
  margin: 0;
}

.intro,
.notice {
  color: var(--color-muted);
}

.notice {
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fbf8f1;
  padding: 12px;
  font-weight: 800;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.success {
  color: var(--color-secondary-accent);
  font-weight: 900;
}

.error {
  color: var(--color-warning);
  font-weight: 900;
}
</style>
