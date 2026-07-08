<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>공지 수정</h1>
        <p>공지사항 제목, 고정 여부, 본문을 변경합니다.</p>
      </div>
    </div>
    <EmptyState
      v-if="!notice"
      title="공지사항을 찾을 수 없어요."
      description="목록에서 다시 선택해 주세요."
      action-label="공지 목록"
      action-to="/admin/notices"
    />
    <AdminNoticeForm v-else :notice="notice" @saved="goList" />
  </main>
</template>

<script setup lang="ts">
import type { Notice } from "~/types/domain";

definePageMeta({ layout: "admin", middleware: "admin" });

const route = useRoute();
const noticeStore = useNoticeStore();
const notice = computed(
  () =>
    noticeStore.notices.find((item) => item.id === String(route.params.id)) ||
    null,
);

onMounted(async () => {
  await noticeStore.fetchNotice(String(route.params.id));
});

const goList = async (_notice: Notice) => {
  await navigateTo("/admin/notices");
};

useHead({ title: "관리자 공지 수정" });
</script>
