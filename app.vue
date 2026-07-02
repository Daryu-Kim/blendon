<template>
  <NuxtLayout>
    <NuxtPage :page-key="route.fullPath" />
    <AppToast />
    <LoadingOverlay
      :show="globalLoading.isLoading.value"
      :label="globalLoading.label.value"
    />
    <NoticePopupOverlay />
  </NuxtLayout>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const toast = useToast();
const globalLoading = useGlobalLoading();
const settingsStore = useSiteSettingsStore();

const absoluteUrl = (path: string) => {
  const base = settingsStore.seo.canonicalBaseUrl.replace(/\/$/, "");
  if (!base || !path) return path || undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

onMounted(async () => {
  await settingsStore.fetchSettings();
});

useHead(() => ({
  titleTemplate: settingsStore.seo.titleTemplate || "%s | BLEND ON",
  meta: [
    { name: "description", content: settingsStore.seo.defaultDescription },
    { name: "keywords", content: settingsStore.seo.defaultKeywords.join(", ") },
    { name: "robots", content: settingsStore.seo.robots },
    { property: "og:title", content: settingsStore.seo.ogTitle },
    { property: "og:description", content: settingsStore.seo.ogDescription },
    { property: "og:image", content: absoluteUrl(settingsStore.seo.ogImageUrl) },
  ],
}));

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
