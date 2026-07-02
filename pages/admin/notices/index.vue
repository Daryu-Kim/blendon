<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>공지사항 관리</h1>
        <p>공지사항을 게시판 형태로 등록, 수정, 삭제합니다.</p>
      </div>
      <Button to="/admin/notices/new" variant="secondary">공지 추가</Button>
    </div>

    <section class="surface notice-search">
      <Input v-model="keyword" placeholder="제목/본문 검색" />
      <Select v-model="pinned">
        <option value="">전체</option>
        <option value="true">고정</option>
        <option value="false">일반</option>
      </Select>
    </section>

    <AdminTable :rows="filteredNotices" :columns="columns" row-key="id">
      <template #isPinned="{ row }">{{ row.isPinned ? "고정" : "일반" }}</template>
      <template #createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
      <template #actions="{ row }">
        <div class="row-actions">
          <Button size="sm" variant="ghost" :to="`/admin/notices/${row.id}`">수정</Button>
          <Button size="sm" variant="danger" @click="remove(row.id)">삭제</Button>
        </div>
      </template>
    </AdminTable>
  </main>
</template>

<script setup lang="ts">
import { formatDate } from "~/utils/format";

definePageMeta({ layout: "admin", middleware: "admin" });

const noticeStore = useNoticeStore();
const keyword = ref("");
const pinned = ref("");
const columns = [
  { key: "title", label: "제목" },
  { key: "isPinned", label: "구분" },
  { key: "createdAt", label: "등록일" },
] as const;

const filteredNotices = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  return noticeStore.sortedNotices.filter((notice) => {
    const matchesKeyword = !q || notice.title.toLowerCase().includes(q) || notice.content.toLowerCase().includes(q);
    const matchesPinned = !pinned.value || String(notice.isPinned) === pinned.value;
    return matchesKeyword && matchesPinned;
  });
});

const remove = async (id: string) => {
  if (!confirm("공지사항을 삭제할까요?")) return;
  await noticeStore.deleteNotice(id);
};

onMounted(async () => {
  await noticeStore.fetchNotices();
});

useHead({ title: "관리자 공지사항 관리" });
</script>

<style scoped>
.notice-search {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
  padding: 14px;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (min-width: 800px) {
  .notice-search {
    grid-template-columns: minmax(0, 1fr) 180px;
  }
}
</style>
