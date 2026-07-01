<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>배너/콘텐츠 관리</h1>
        <p>홈 메인 배너와 콘텐츠 영역을 관리합니다.</p>
      </div>
    </div>

    <AdminFormSection title="배너 등록">
      <div class="form-row"><label>제목</label><Input v-model="title" /></div>
      <div class="form-row">
        <label>부제목</label><Input v-model="subtitle" />
      </div>
      <div class="form-row"><label>링크</label><Input v-model="linkUrl" /></div>
      <div class="form-row">
        <label>이미지</label><ImageUploader v-model="imageUrl" />
      </div>
      <Button @click="addBanner">추가</Button>
    </AdminFormSection>

    <AdminTable :rows="banners" :columns="columns" row-key="id">
      <template #isActive="{ row }">{{
        row.isActive ? "활성" : "비활성"
      }}</template>
    </AdminTable>
  </main>
</template>

<script setup lang="ts">
import { mockBanners } from "~/data/mock";
import type { Banner } from "~/types/domain";
import { toSafeId } from "~/utils/format";

definePageMeta({ layout: "admin", middleware: "admin" });
const banners = ref<Banner[]>([...mockBanners]);
const title = ref("");
const subtitle = ref("");
const linkUrl = ref("/products");
const imageUrl = ref("");
const columns = [
  { key: "title", label: "제목" },
  { key: "subtitle", label: "부제목" },
  { key: "linkUrl", label: "링크" },
  { key: "placement", label: "위치" },
  { key: "isActive", label: "상태" },
] as const;

const addBanner = () => {
  if (!title.value) return;
  banners.value.unshift({
    id: toSafeId(title.value),
    title: title.value,
    subtitle: subtitle.value,
    imageUrl: imageUrl.value,
    buttonText: "바로가기",
    linkUrl: linkUrl.value,
    isActive: true,
    order: banners.value.length + 1,
    placement: "home-section",
  });
  title.value = "";
  subtitle.value = "";
  imageUrl.value = "";
};

useHead({ title: "관리자 배너 관리" });
</script>
