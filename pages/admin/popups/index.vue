<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>공지 팝업 관리</h1>
        <p>사이트 진입 시 표시되는 오버레이 공지 모달을 관리합니다.</p>
      </div>
      <Button to="/admin/popups/new" variant="secondary">팝업 추가</Button>
    </div>

    <section class="surface popup-search">
      <Input v-model="keyword" placeholder="제목/본문 검색" />
      <Select v-model="activeFilter">
        <option value="">전체</option>
        <option value="true">활성</option>
        <option value="false">비활성</option>
      </Select>
    </section>

    <AdminTable :rows="filteredPopups" :columns="columns" row-key="id">
      <template #isActive="{ row }">{{
        row.isActive ? "활성" : "비활성"
      }}</template>
      <template #placement="{ row }">{{
        row.placement === "all" ? "전체" : "메인"
      }}</template>
      <template #dismissMode="{ row }">{{
        dismissLabels[row.dismissMode]
      }}</template>
      <template #actions="{ row }">
        <div class="row-actions">
          <Button size="sm" variant="ghost" :to="`/admin/popups/${row.id}`"
            >수정</Button
          >
          <Button size="sm" variant="danger" @click="remove(row.id)"
            >삭제</Button
          >
        </div>
      </template>
    </AdminTable>
  </main>
</template>

<script setup lang="ts">
const popupStore = useNoticePopupStore();
const keyword = ref("");
const activeFilter = ref("");
const dismissLabels = {
  session: "세션 닫기",
  today: "오늘 닫기",
  none: "매번 표시",
};

const columns = [
  { key: "title", label: "제목" },
  { key: "isActive", label: "상태" },
  { key: "placement", label: "위치" },
  { key: "dismissMode", label: "닫기 방식" },
  { key: "order", label: "순서" },
] as const;

const filteredPopups = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  return popupStore.popups.filter((popup) => {
    const matchesKeyword =
      !q ||
      popup.title.toLowerCase().includes(q) ||
      popup.content.toLowerCase().includes(q);
    const matchesActive =
      !activeFilter.value || String(popup.isActive) === activeFilter.value;
    return matchesKeyword && matchesActive;
  });
});

const remove = async (id: string) => {
  if (!confirm("공지 팝업을 삭제할까요?")) return;
  await popupStore.deletePopup(id);
};

onMounted(async () => {
  await popupStore.fetchPopups(true);
});

definePageMeta({ layout: "admin", middleware: "admin" });
useHead({ title: "관리자 공지 팝업 관리" });
</script>

<style scoped>
.popup-search {
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
  .popup-search {
    grid-template-columns: minmax(0, 1fr) 180px;
  }
}
</style>
