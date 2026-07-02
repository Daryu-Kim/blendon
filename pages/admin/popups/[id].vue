<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>공지 팝업 수정</h1>
        <p>공지 팝업 문구, 노출 기간, 닫기 방식을 변경합니다.</p>
      </div>
    </div>
    <EmptyState
      v-if="!popup"
      title="공지 팝업을 찾을 수 없어요."
      description="목록에서 다시 선택해 주세요."
      action-label="팝업 목록"
      action-to="/admin/popups"
    />
    <AdminNoticePopupForm v-else :popup="popup" @saved="goList" />
  </main>
</template>

<script setup lang="ts">
import type { NoticePopup } from "~/types/domain";

const route = useRoute();
const popupStore = useNoticePopupStore();
const popup = computed(
  () => popupStore.findById(String(route.params.id)) || null,
);

onMounted(async () => {
  await popupStore.fetchPopup(String(route.params.id));
});

const goList = async (_popup: NoticePopup) => {
  await navigateTo("/admin/popups");
};

definePageMeta({ layout: "admin", middleware: "admin" });
useHead({ title: "관리자 공지 팝업 수정" });
</script>
