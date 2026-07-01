<template>
  <NuxtLayout>
    <NuxtPage />
    <AppToast />
    <LoadingOverlay
      :show="globalLoading.isLoading.value"
      :label="globalLoading.label.value"
    />
  </NuxtLayout>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const toast = useToast();
const globalLoading = useGlobalLoading();

watch(
  () => route.query.notice,
  async (notice) => {
    if (notice !== "admin-forbidden" || !import.meta.client) return;
    toast.show("관리자 권한이 필요한 페이지입니다.", "warning");
    const nextQuery = { ...route.query };
    delete nextQuery.notice;
    await router.replace({ path: route.path, query: nextQuery });
  },
  { immediate: true },
);
</script>
