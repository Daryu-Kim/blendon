<template>
  <main class="section page-shell">
    <div class="section-title">
      <div>
        <h1>공지사항</h1>
        <p>서비스 운영과 인증 정책 관련 안내입니다.</p>
      </div>
    </div>

    <div v-if="noticeStore.sortedNotices.length" class="notice-board surface">
      <NuxtLink
        v-for="notice in noticeStore.sortedNotices"
        :key="notice.id"
        :to="`/notices/${notice.id}`"
        class="notice-row"
      >
        <span v-if="notice.isPinned" class="pill">고정</span>
        <strong>{{ notice.title }}</strong>
        <p>{{ excerpt(notice.content) }}</p>
        <time>{{ formatDate(notice.createdAt) }}</time>
      </NuxtLink>
    </div>
    <EmptyState v-else title="등록된 공지사항이 없어요." description="새로운 안내가 등록되면 이곳에서 확인할 수 있습니다." />
  </main>
</template>

<script setup lang="ts">
import { formatDate } from "~/utils/format";

const noticeStore = useNoticeStore();

const excerpt = (content: string) => content.replace(/[#>*_`!()[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 110);

onMounted(async () => {
  await noticeStore.fetchNotices();
});

useHead({ title: "공지사항" });
</script>

<style scoped>
.notice-board {
  display: grid;
  overflow: hidden;
}

.notice-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 6px 10px;
  border-bottom: 1px solid var(--color-line);
  padding: 16px;
}

.notice-row:last-child {
  border-bottom: 0;
}

.notice-row strong,
.notice-row p,
.notice-row time {
  grid-column: 1 / -1;
}

.notice-row p,
.notice-row time {
  margin: 0;
  color: var(--color-muted);
}

.notice-row strong {
  font-size: 17px;
}

.notice-row time {
  font-size: 13px;
}
</style>
