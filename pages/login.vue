<template>
  <main class="section page-shell auth-page">
    <section class="surface auth-card">
      <p class="eyebrow">LOGIN</p>
      <h1>로그인</h1>
      <form class="form-grid" @submit.prevent="submit">
        <div class="form-row">
          <label for="email">이메일</label>
          <Input id="email" v-model="email" type="email" autocomplete="email" required />
        </div>
        <div class="form-row">
          <label for="password">비밀번호</label>
          <Input id="password" v-model="password" type="password" autocomplete="current-password" required />
        </div>
        <p v-if="auth.error" class="error">{{ auth.error }}</p>
        <Button type="submit" size="lg">로그인</Button>
      </form>
      <p class="muted">테스트 관리자: admin@example.com / 아무 비밀번호</p>
      <NuxtLink to="/signup">회원가입하기</NuxtLink>
    </section>
  </main>
</template>

<script setup lang="ts">
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const email = ref('customer@example.com')
const password = ref('password')

const submit = async () => {
  await auth.signIn(email.value, password.value)
  await router.push((route.query.redirect as string) || '/mypage')
}

useHead({ title: '로그인' })
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
