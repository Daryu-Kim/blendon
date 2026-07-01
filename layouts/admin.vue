<template>
  <ClientOnly>
    <AdminLayout v-if="auth.initialized && auth.isAdmin">
      <slot />
    </AdminLayout>
    <div v-else class="admin-check">
      <div class="surface admin-check-panel">
        <strong>관리자 권한 확인 중</strong>
        <p>잠시만 기다려 주세요.</p>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const toast = useToast();

onMounted(async () => {
  await auth.init();
  if (!auth.isAdmin) {
    toast.show("관리자 권한이 필요한 페이지입니다.", "warning");
    await navigateTo(
      { path: "/", query: { notice: "admin-forbidden" } },
      { replace: true },
    );
  }
});
</script>

<style scoped>
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
</style>
