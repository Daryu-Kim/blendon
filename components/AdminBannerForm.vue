<template>
  <form class="banner-form" @submit.prevent="submit">
    <AdminFormSection
      title="배너 기본 정보"
      description="홈 슬라이드와 콘텐츠 영역에 노출할 배너 문구를 설정합니다."
    >
      <div class="form-grid">
        <div class="form-row">
          <label>제목</label>
          <Input v-model="form.title" required />
        </div>
        <div class="form-row wide">
          <label>부제목</label>
          <Input v-model="form.subtitle" />
        </div>
        <div class="form-row">
          <label>버튼 문구</label>
          <Input v-model="form.buttonText" />
        </div>
        <div class="form-row">
          <label>링크</label>
          <Input v-model="form.linkUrl" />
        </div>
        <div class="form-row">
          <label>위치</label>
          <Select v-model="form.placement">
            <option value="home-main">홈 메인</option>
            <option value="home-section">홈 섹션</option>
            <option value="notice">공지</option>
          </Select>
        </div>
        <div class="form-row">
          <label>순서</label>
          <Input v-model="form.order" type="number" min="0" />
        </div>
        <div class="form-row">
          <label>활성</label>
          <Select v-model="activeText">
            <option value="true">활성</option>
            <option value="false">비활성</option>
          </Select>
        </div>
      </div>
    </AdminFormSection>

    <AdminFormSection
      title="이미지"
      description="Storage에 업로드하거나 외부 이미지 URL을 입력합니다."
    >
      <ImageUploader v-model="form.imageUrl" path-prefix="banners" />
    </AdminFormSection>

    <div class="sticky-actions">
      <Button type="button" variant="ghost" to="/admin/banners">목록</Button>
      <Button type="submit">저장</Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Banner } from "~/types/domain";
import { toSafeId } from "~/utils/format";

const props = defineProps<{ banner?: Banner | null }>();
const emit = defineEmits<{ saved: [banner: Banner] }>();

const bannerStore = useBannerStore();

const createEmptyBanner = (): Banner => ({
  id: "",
  title: "",
  subtitle: "",
  imageUrl: "",
  buttonText: "바로가기",
  linkUrl: "/products",
  isActive: true,
  order: bannerStore.banners.length + 1,
  placement: "home-main",
});

const form = reactive<Banner>(
  props.banner
    ? JSON.parse(JSON.stringify(props.banner))
    : createEmptyBanner(),
);

const activeText = computed({
  get: () => String(form.isActive),
  set: (value) => {
    form.isActive = value === "true";
  },
});

const submit = async () => {
  const banner: Banner = {
    ...form,
    id: form.id || `banner-${toSafeId(form.title)}-${Date.now()}`,
    order: Number(form.order || 0),
  };
  await bannerStore.upsertBanner(banner);
  emit("saved", banner);
};
</script>

<style scoped>
.banner-form {
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
