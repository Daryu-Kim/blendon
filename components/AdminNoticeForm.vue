<template>
  <form class="notice-form" @submit.prevent="submit">
    <AdminFormSection title="공지사항 정보" description="제목과 고정 여부를 설정합니다.">
      <div class="form-grid">
        <div class="form-row wide">
          <label>제목</label>
          <Input v-model="form.title" required />
        </div>
        <div class="form-row">
          <label>상단 고정</label>
          <Select v-model="pinnedText">
            <option value="false">일반</option>
            <option value="true">고정</option>
          </Select>
        </div>
      </div>
    </AdminFormSection>

    <AdminFormSection title="본문" description="마크다운으로 작성하며 이미지는 Firebase Storage에 업로드해 삽입합니다.">
      <MarkdownEditor v-model="form.content" path-prefix="notices" />
    </AdminFormSection>

    <div class="sticky-actions">
      <Button type="button" variant="ghost" to="/admin/notices">목록</Button>
      <Button type="submit">저장</Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Notice } from "~/types/domain";
import { toSafeId } from "~/utils/format";

const props = defineProps<{ notice?: Notice | null }>();
const emit = defineEmits<{ saved: [notice: Notice] }>();

const noticeStore = useNoticeStore();
const now = new Date().toISOString();
const form = reactive<Notice>(
  props.notice
    ? JSON.parse(JSON.stringify(props.notice))
    : {
        id: "",
        title: "",
        content: "",
        isPinned: false,
        createdAt: now,
        updatedAt: now,
      },
);

const pinnedText = computed({
  get: () => String(form.isPinned),
  set: (value) => {
    form.isPinned = value === "true";
  },
});

const submit = async () => {
  const notice: Notice = {
    ...form,
    id: form.id || `notice-${toSafeId(form.title)}-${Date.now()}`,
    createdAt: form.createdAt || now,
    updatedAt: new Date().toISOString(),
  };
  await noticeStore.upsertNotice(notice);
  emit("saved", notice);
};
</script>

<style scoped>
.notice-form {
  display: grid;
  gap: 18px;
}

.form-grid {
  display: grid;
  gap: 14px;
}

.wide {
  grid-column: 1 / -1;
}

.sticky-actions {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid var(--color-line);
  background: rgba(247, 243, 234, 0.92);
  padding: 14px 0;
  backdrop-filter: blur(14px);
}

@media (min-width: 860px) {
  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
