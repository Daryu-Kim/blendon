<template>
  <ClientOnly>
    <div v-if="auth.initialized && auth.isAdmin" class="admin-layout">
      <AdminSidebar />
      <main class="admin-main">
        <slot />
      </main>
    </div>
    <div v-else class="admin-check">
      <div class="surface admin-check-panel">
        <strong>관리자 권한 확인 중</strong>
        <p>잠시만 기다려 주세요.</p>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
const auth = useAuthStore()

onMounted(() => {
  auth.init()
})
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #fbf8f1;
}

.admin-check {
  display: grid;
  min-height: 100vh;
  place-items: center;
  background: var(--color-background);
  padding: 24px;
}

.admin-check-panel {
  display: grid;
  width: min(360px, 100%);
  gap: 8px;
  padding: 22px;
  text-align: center;
}

.admin-check-panel strong {
  font-size: 18px;
}

.admin-check-panel p {
  margin: 0;
  color: var(--color-muted);
}

.admin-main {
  padding: 18px;
}

@media (min-width: 960px) {
  .admin-layout {
    display: grid;
    grid-template-columns: 248px minmax(0, 1fr);
  }

  .admin-main {
    padding: 28px;
  }
}
</style>
