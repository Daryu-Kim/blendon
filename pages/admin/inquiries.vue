<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>문의 관리</h1>
        <p>고객센터에서 접수된 문의를 확인하고 답변 상태를 관리합니다.</p>
      </div>
    </div>

    <AdminTable :rows="inquiryStore.inquiries" :columns="columns" row-key="id">
      <template #userName="{ row }">
        <div>
          <strong>{{ row.userName || "-" }}</strong>
          <p>{{ row.userEmail || row.userId }}</p>
        </div>
      </template>
      <template #content="{ row }">
        <p class="content-preview">{{ row.content }}</p>
      </template>
      <template #status="{ row }">
        <Select
          :model-value="row.status"
          @update:model-value="updateStatus(row.id, $event)"
        >
          <option value="waiting">대기</option>
          <option value="answered">답변 완료</option>
          <option value="closed">종료</option>
        </Select>
      </template>
      <template #createdAt="{ row }">
        {{ formatDate(row.createdAt) }}
      </template>
      <template #actions="{ row }">
        <div class="answer-box">
          <Textarea
            :model-value="answers[row.id] ?? row.answer ?? ''"
            rows="3"
            placeholder="답변 내용을 입력하세요."
            @update:model-value="answers[row.id] = $event"
          />
          <Button size="sm" @click="saveAnswer(row.id)">답변 저장</Button>
        </div>
      </template>
    </AdminTable>
  </main>
</template>

<script setup lang="ts">
import type { InquiryStatus } from "~/types/domain";

definePageMeta({ layout: "admin", middleware: "admin" });

const inquiryStore = useInquiryStore();
const answers = reactive<Record<string, string>>({});
const columns = [
  { key: "userName", label: "회원" },
  { key: "title", label: "제목" },
  { key: "content", label: "내용" },
  { key: "status", label: "상태" },
  { key: "createdAt", label: "접수일" },
] as const;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const updateStatus = async (id: string, status: string) => {
  await inquiryStore.updateInquiry(id, { status: status as InquiryStatus });
};

const saveAnswer = async (id: string) => {
  const answer = answers[id]?.trim();
  if (!answer) return;
  await inquiryStore.updateInquiry(id, {
    answer,
    status: "answered",
    answeredAt: new Date().toISOString(),
  });
};

onMounted(async () => {
  await inquiryStore.fetchInquiries(true);
});

useHead({ title: "관리자 문의 관리" });
</script>

<style scoped>
.content-preview {
  display: -webkit-box;
  max-width: 280px;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  white-space: pre-wrap;
}

td p,
.content-preview {
  margin: 0;
  color: var(--color-muted);
}

.answer-box {
  display: grid;
  min-width: 260px;
  gap: 8px;
}
</style>
