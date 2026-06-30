<template>
  <div v-if="allowed">
    <slot />
  </div>
  <div v-else class="adult-gate">
    <div>
      <p class="eyebrow">ADULT ONLY</p>
      <h2>성인 회원만 이용할 수 있어요.</h2>
      <p>{{ brand.name }}은 회원가입 시 확인된 성인 고객을 위한 취향 기반 커머스입니다.</p>
    </div>
    <Button :to="auth.isLoggedIn ? '/support' : '/signup'" variant="secondary">
      {{ auth.isLoggedIn ? '고객센터 문의' : '회원가입' }}
    </Button>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()
const { brand } = useAppConfig()
const allowed = computed(() => Boolean(auth.profile?.isAdultVerified))
</script>

<style scoped>
.adult-gate {
  display: grid;
  gap: 18px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff8ee;
  padding: 24px;
}

.adult-gate h2 {
  margin: 0 0 8px;
}

.adult-gate p {
  margin: 0;
  color: var(--color-muted);
}
</style>
