<template>
  <form class="popup-form" @submit.prevent="submit">
    <AdminFormSection
      title="팝업 기본 정보"
      description="사이트 진입 시 오버레이로 노출할 공지 팝업을 설정합니다."
    >
      <div class="form-grid">
        <div class="form-row">
          <label>제목</label>
          <Input v-model="form.title" required />
        </div>
        <div class="form-row">
          <label>활성</label>
          <Select v-model="activeText">
            <option value="true">활성</option>
            <option value="false">비활성</option>
          </Select>
        </div>
        <div class="form-row">
          <label>노출 위치</label>
          <Select v-model="form.placement">
            <option value="main">메인 접속 시</option>
            <option value="all">전체 페이지</option>
          </Select>
        </div>
        <div class="form-row">
          <label>닫기 방식</label>
          <Select v-model="form.dismissMode">
            <option value="today">오늘 하루 닫기</option>
            <option value="session">브라우저 세션 동안 닫기</option>
            <option value="none">매번 표시</option>
          </Select>
        </div>
        <div class="form-row">
          <label>노출 시작</label>
          <Input v-model="startsAtText" type="datetime-local" />
        </div>
        <div class="form-row">
          <label>노출 종료</label>
          <Input v-model="endsAtText" type="datetime-local" />
        </div>
        <div class="form-row">
          <label>순서</label>
          <Input v-model="form.order" type="number" min="0" />
        </div>
      </div>
    </AdminFormSection>

    <AdminFormSection title="이미지/링크" description="팝업 상단 이미지와 연결 링크를 설정합니다.">
      <div class="form-grid">
        <div class="form-row">
          <label>이미지</label>
          <ImageUploader v-model="form.imageUrl" path-prefix="notice-popups" />
        </div>
        <div class="form-row">
          <label>버튼 문구</label>
          <Input v-model="form.buttonText" />
        </div>
        <div class="form-row wide">
          <label>링크</label>
          <Input v-model="form.linkUrl" placeholder="/products 또는 외부 URL" />
        </div>
      </div>
    </AdminFormSection>

    <AdminFormSection title="본문" description="md-editor-v3로 작성하며 이미지는 Storage에 업로드됩니다.">
      <MarkdownEditor v-model="form.content" path-prefix="notice-popups/content" />
    </AdminFormSection>

    <div class="sticky-actions">
      <Button type="button" variant="ghost" to="/admin/popups">목록</Button>
      <Button type="submit">저장</Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { NoticePopup } from "~/types/domain";
import { toSafeId } from "~/utils/format";

const props = defineProps<{ popup?: NoticePopup | null }>();
const emit = defineEmits<{ saved: [popup: NoticePopup] }>();

const popupStore = useNoticePopupStore();
const now = new Date().toISOString();

const toLocalDatetime = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

const fromLocalDatetime = (value: string) =>
  value ? new Date(value).toISOString() : null;

const form = reactive<NoticePopup>(
  props.popup
    ? JSON.parse(JSON.stringify(props.popup))
    : {
        id: "",
        title: "",
        content: "",
        imageUrl: "",
        linkUrl: "",
        buttonText: "자세히 보기",
        placement: "main",
        isActive: true,
        dismissMode: "today",
        startsAt: null,
        endsAt: null,
        order: popupStore.popups.length + 1,
        createdAt: now,
        updatedAt: now,
      },
);

const startsAtText = ref(toLocalDatetime(form.startsAt));
const endsAtText = ref(toLocalDatetime(form.endsAt));

const activeText = computed({
  get: () => String(form.isActive),
  set: (value) => {
    form.isActive = value === "true";
  },
});

const submit = async () => {
  const popup: NoticePopup = {
    ...form,
    id: form.id || `popup-${toSafeId(form.title)}-${Date.now()}`,
    startsAt: fromLocalDatetime(startsAtText.value),
    endsAt: fromLocalDatetime(endsAtText.value),
    order: Number(form.order || 0),
    createdAt: form.createdAt || now,
    updatedAt: new Date().toISOString(),
  };
  await popupStore.upsertPopup(popup);
  emit("saved", popup);
};
</script>

<style scoped>
.popup-form {
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
