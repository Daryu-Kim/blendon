<template>
  <main class="section page-shell auth-page">
    <section class="surface auth-card">
      <p class="eyebrow">LOGIN</p>
      <h1>로그인</h1>
      <form class="form-grid" @submit.prevent="submit">
        <div class="form-row">
          <label for="email">이메일</label>
          <Input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
          />
        </div>
        <div class="form-row">
          <label for="password">비밀번호</label>
          <Input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
          />
        </div>
        <p v-if="errorMessage || auth.error" class="error">
          {{ errorMessage || auth.error }}
        </p>
        <Button type="submit" size="lg" :disabled="submitting || auth.loading">
          {{ submitting || auth.loading ? "로그인 중" : "로그인" }}
        </Button>
      </form>
      <NuxtLink to="/signup">회원 가입하기</NuxtLink>
    </section>
  </main>
</template>

<script setup lang="ts">
import { toUserMessage } from "~/utils/error-message";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const email = ref("");
const password = ref("");
const submitting = ref(false);
const errorMessage = ref("");

const submit = async () => {
  if (submitting.value || auth.loading) return;
  const globalLoading = useGlobalLoading();
  submitting.value = true;
  errorMessage.value = "";
  globalLoading.start("로그인 처리 중");
  await nextTick();
  try {
    await auth.signIn(email.value, password.value);
    await router.push((route.query.redirect as string) || "/mypage");
  } catch (error) {
    errorMessage.value =
      auth.error ||
      toUserMessage(
        error,
        "로그인에 실패했어요. 입력한 정보를 다시 확인해 주세요.",
      );
  } finally {
    submitting.value = false;
    globalLoading.stop();
  }
};

useHead({ title: "로그인" });
</script>

<style scoped>
.auth-page {
  display: grid;
  place-items: center;
  min-height: 64vh;
}

.auth-card {
  display: grid;
  gap: 18px;
  width: min(460px, 100%);
  padding: 24px;
}

h1,
p {
  margin: 0;
}

.error {
  color: var(--color-warning);
  font-weight: 800;
}
</style>
