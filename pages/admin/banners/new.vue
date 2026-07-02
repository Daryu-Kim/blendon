<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>배너 추가</h1>
        <p>슬라이드 또는 콘텐츠 배너를 등록합니다.</p>
      </div>
    </div>
    <AdminBannerForm @saved="goList" />
  </main>
</template>

<script setup lang="ts">
import type { Banner } from "~/types/domain";

definePageMeta({ layout: "admin", middleware: "admin" });

const bannerStore = useBannerStore();

onMounted(async () => {
  await bannerStore.fetchBanners();
});

const goList = async (_banner: Banner) => {
  await navigateTo("/admin/banners");
};

useHead({ title: "관리자 배너 추가" });
</script>
