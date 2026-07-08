<template>
  <main class="section page-shell">
    <EmptyState
      v-if="!notice"
      title="공지사항을 찾을 수 없어요."
      description="목록에서 다시 선택해 주세요."
      action-label="공지사항 목록"
      action-to="/notices"
    />
    <article v-else class="notice-detail surface">
      <div class="notice-head">
        <span v-if="notice.isPinned" class="pill">고정</span>
        <h1>{{ notice.title }}</h1>
        <time>{{ formatDate(notice.createdAt) }}</time>
      </div>
      <MarkdownContent class="notice-body" :content="notice.content" />
      <div class="notice-actions">
        <Button to="/notices" variant="ghost">목록</Button>
      </div>
    </article>
  </main>
</template>

<script setup lang="ts">
import { formatDate } from "~/utils/format";

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

useHead(() => ({ title: notice.value?.title || "공지사항" }));
</script>

<style scoped>
.notice-detail {
  display: grid;
  gap: 22px;
  padding: 22px;
}

.notice-head {
  display: grid;
  gap: 8px;
  border-bottom: 1px solid var(--color-line);
  padding-bottom: 18px;
}

.notice-head .pill {
  justify-self: start;
  width: fit-content;
}

h1 {
  margin: 0;
  font-size: clamp(24px, 5vw, 34px);
}

time {
  color: var(--color-muted);
}

.notice-body {
  min-height: 120px;
}

.notice-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
