<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>배너 수정</h1>
        <p>배너 문구, 이미지, 노출 상태를 변경합니다.</p>
      </div>
    </div>
    <EmptyState
      v-if="!banner"
      title="배너를 찾을 수 없어요."
      description="목록에서 다시 선택해 주세요."
      action-label="배너 목록"
      action-to="/admin/banners"
    />
    <AdminBannerForm v-else :banner="banner" @saved="goList" />
  </main>
</template>

<script setup lang="ts">
import type { Banner } from "~/types/domain";

definePageMeta({ layout: "admin", middleware: "admin" });

const route = useRoute();
const bannerStore = useBannerStore();
const banner = computed(() => bannerStore.findById(String(route.params.id)));

onMounted(async () => {
  await bannerStore.fetchBanners(true);
});

const goList = async (_banner: Banner) => {
  await navigateTo("/admin/banners");
};

useHead({ title: "관리자 배너 수정" });
</script>
