<template>
  <form class="settings-form" @submit.prevent="submit">
    <AdminFormSection
      title="쇼핑몰 기본 설정"
      description="몰 이름, 성인 전용 운영 정책, 사업자 표시 정보를 관리합니다."
    >
      <div class="form-grid">
        <div class="form-row">
          <label>쇼핑몰명</label>
          <Input v-model="globalForm.mallName" required />
        </div>
        <div class="form-row wide">
          <label>쇼핑몰 설명</label>
          <Input v-model="globalForm.mallDescription" />
        </div>
        <div class="form-row">
          <label>사이트 성인 전용</label>
          <Select model-value="true" disabled>
            <option value="true">성인 전용 고정</option>
          </Select>
        </div>
        <div class="form-row">
          <label>탐색 전 성인 확인 요구</label>
          <Select v-model="requireAdultText">
            <option value="false">회원가입/구매 단계에서 확인</option>
            <option value="true">사이트 탐색 전 확인</option>
          </Select>
        </div>
        <div class="form-row">
          <label>소비자 성인 인증 상태 노출</label>
          <Select model-value="false" disabled>
            <option value="false">노출하지 않음</option>
          </Select>
        </div>
      </div>
    </AdminFormSection>

    <AdminFormSection
      title="사업자/고객센터 정보"
      description="결제 심사와 푸터 표시 영역에 사용하는 정보를 입력합니다."
    >
      <div class="form-grid">
        <div class="form-row">
          <label>상호</label>
          <Input v-model="globalForm.businessName" />
        </div>
        <div class="form-row">
          <label>대표자</label>
          <Input v-model="globalForm.representativeName" />
        </div>
        <div class="form-row">
          <label>사업자등록번호</label>
          <Input v-model="globalForm.businessRegistrationNumber" />
        </div>
        <div class="form-row">
          <label>통신판매업 신고번호</label>
          <Input v-model="globalForm.mailOrderSalesNumber" />
        </div>
        <div class="form-row wide">
          <label>사업장 주소</label>
          <Input v-model="globalForm.businessAddress" />
        </div>
        <div class="form-row">
          <label>고객센터 전화</label>
          <Input v-model="globalForm.customerCenterPhone" />
        </div>
        <div class="form-row">
          <label>고객센터 이메일</label>
          <Input v-model="globalForm.customerCenterEmail" />
        </div>
      </div>
    </AdminFormSection>

    <AdminFormSection
      title="SEO 기본 설정"
      description="카페24 관리자처럼 사이트 기본 메타 정보를 관리합니다."
    >
      <div class="form-grid">
        <div class="form-row">
          <label>기본 타이틀</label>
          <Input v-model="seoForm.defaultTitle" />
        </div>
        <div class="form-row">
          <label>타이틀 템플릿</label>
          <Input v-model="seoForm.titleTemplate" placeholder="%s | BLEND ON" />
        </div>
        <div class="form-row wide">
          <label>기본 설명</label>
          <Input v-model="seoForm.defaultDescription" />
        </div>
        <div class="form-row wide">
          <label>기본 키워드</label>
          <Input v-model="keywordsText" placeholder="쉼표로 구분" />
        </div>
        <div class="form-row">
          <label>OG 타이틀</label>
          <Input v-model="seoForm.ogTitle" />
        </div>
        <div class="form-row">
          <label>OG 이미지</label>
          <ImageUploader v-model="seoForm.ogImageUrl" path-prefix="seo" />
        </div>
        <div class="form-row wide">
          <label>OG 설명</label>
          <Input v-model="seoForm.ogDescription" />
        </div>
        <div class="form-row">
          <label>대표 도메인</label>
          <Input v-model="seoForm.canonicalBaseUrl" placeholder="https://example.com" />
        </div>
        <div class="form-row">
          <label>robots</label>
          <Input v-model="seoForm.robots" />
        </div>
      </div>
    </AdminFormSection>

    <div class="sticky-actions">
      <Button type="submit">설정 저장</Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { SiteGlobalSettings, SiteSeoSettings } from "~/types/domain";

const settingsStore = useSiteSettingsStore();
await settingsStore.fetchSettings();

const globalForm = reactive<SiteGlobalSettings>(
  JSON.parse(JSON.stringify(settingsStore.global)),
);
const seoForm = reactive<SiteSeoSettings>(
  JSON.parse(JSON.stringify(settingsStore.seo)),
);
const keywordsText = ref(seoForm.defaultKeywords.join(", "));

const requireAdultText = computed({
  get: () => String(globalForm.requireAdultVerificationToBrowse),
  set: (value) => {
    globalForm.requireAdultVerificationToBrowse = value === "true";
  },
});

const splitKeywords = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const submit = async () => {
  await settingsStore.saveGlobalSettings(globalForm);
  await settingsStore.saveSeoSettings({
    ...seoForm,
    defaultKeywords: splitKeywords(keywordsText.value),
  });
  useToast().show("쇼핑몰 설정을 저장했습니다.", "success");
};
</script>

<style scoped>
.settings-form {
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
