<template>
  <main class="section page-shell verification-page">
    <section class="surface verification-card">
      <p class="eyebrow">ADULT MEMBER</p>
      <h1>성인 회원 확인이 필요해요.</h1>
      <p>{{ brand.name }}은 회원가입 시 성인 여부를 1회 확인합니다.</p>
      <form class="form-grid" @submit.prevent="submit">
        <div class="form-row">
          <label for="birthDate">생년월일</label>
          <Input id="birthDate" v-model="birthDate" type="date" required />
        </div>
        <p class="muted">기존 계정 보정용 화면입니다. 신규 회원은 회원가입 단계에서 확인합니다.</p>
        <p v-if="error || verifier.error.value" class="error">{{ error || verifier.error.value }}</p>
        <Button type="submit" size="lg">확인 진행</Button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
const { brand } = useAppConfig()
const auth = useAuthStore()
const verifier = useAdultVerification()
const router = useRouter()
const birthDate = ref('1990-01-01')
const error = ref('')

const submit = async () => {
  error.value = ''
  if (!auth.profile) {
    await router.push('/login?redirect=/adult-verification')
    return
  }
  await verifier.verifyWithMockProvider(birthDate.value)
  await router.push('/mypage')
}

onMounted(async () => {
  await auth.init()
  if (auth.isAdultVerified) await router.push('/mypage')
})

useHead({ title: '성인 회원 확인' })
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
