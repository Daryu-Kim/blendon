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
const { data: seoSettings } = await useAsyncData(
  "site-seo-settings",
  () => $fetch("/api/site-settings/seo"),
  {
    default: () => ({
      defaultTitle: "BLEND ON",
      titleTemplate: "%s | BLEND ON",
      defaultDescription:
        "성인 취향을 쉽고 깔끔하게 고르는 라이프스타일 편집샵",
      defaultKeywords: ["성인 라이프스타일", "편집샵", "디바이스", "플레이버"],
      ogTitle: "BLEND ON",
      ogDescription: "성인 취향을 쉽고 깔끔하게 고르는 라이프스타일 편집샵",
      ogImageUrl: "/og-image.svg",
      canonicalBaseUrl: "",
      robots: "index,follow",
    }),
  },
);

const absoluteUrl = (path: string) => {
  const base = seoSettings.value.canonicalBaseUrl.replace(/\/$/, "");
  if (!base || !path) return path || undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

useHead(() => ({
  titleTemplate: seoSettings.value.titleTemplate || "%s | BLEND ON",
  link: [
    {
      rel: "alternate",
      type: "application/rss+xml",
      title: "BLEND ON RSS",
      href: absoluteUrl("/rss.xml"),
    },
  ],
  meta: [
    { name: "description", content: seoSettings.value.defaultDescription },
    { name: "keywords", content: seoSettings.value.defaultKeywords.join(", ") },
    { name: "robots", content: seoSettings.value.robots },
    { property: "og:title", content: seoSettings.value.ogTitle },
    { property: "og:description", content: seoSettings.value.ogDescription },
    {
      property: "og:image",
      content: absoluteUrl(seoSettings.value.ogImageUrl),
    },
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
