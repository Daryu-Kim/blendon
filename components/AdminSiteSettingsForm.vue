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
      description="결제, 푸터, 안내 영역에 사용하는 정보를 입력합니다."
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
      title="배송/픽업/입금 설정"
      description="주문서에 표시되는 기본 배송비, 매장 위치 링크, 계좌이체 입금 계좌를 관리합니다. 무료배송 기준은 회원 등급 관리에서 등급별로 설정합니다."
    >
      <div class="form-grid">
        <div class="form-row">
          <label>기본 배송비</label>
          <Input v-model="globalForm.baseDeliveryFee" type="number" min="0" />
        </div>
        <div class="form-row wide">
          <label>매장 지도 링크</label>
          <Input
            v-model="globalForm.storeMapUrl"
            placeholder="https://map.naver.com/..."
          />
        </div>
        <div class="form-row">
          <label>입금 은행</label>
          <Input v-model="globalForm.depositBankName" />
        </div>
        <div class="form-row">
          <label>입금 계좌번호</label>
          <Input v-model="globalForm.depositAccountNumber" />
        </div>
        <div class="form-row">
          <label>예금주</label>
          <Input v-model="globalForm.depositAccountHolder" />
        </div>
      </div>
    </AdminFormSection>

    <AdminFormSection
      title="홈 화면 카테고리 설정"
      description="SHOP BY CATEGORY 타일과 BEST PRODUCT 탭에 노출할 카테고리를 선택합니다. BEST PRODUCT에는 전체 탭이 기본으로 함께 표시됩니다."
    >
      <div class="form-grid">
        <div class="form-row wide">
          <label>SHOP BY CATEGORY</label>
          <select
            v-model="globalForm.homeCategoryTileIds"
            class="multi-select"
            multiple
          >
            <option
              v-for="category in categoryOptions"
              :key="category.id"
              :value="category.id"
            >
              {{ category.treeName }}
            </option>
          </select>
          <p class="field-help">홈의 빠른 카테고리 타일에 표시됩니다.</p>
        </div>
        <div class="form-row wide">
          <label>BEST PRODUCT 카테고리 탭</label>
          <select
            v-model="globalForm.homeBestCategoryIds"
            class="multi-select"
            multiple
          >
            <option
              v-for="category in categoryOptions"
              :key="category.id"
              :value="category.id"
            >
              {{ category.treeName }}
            </option>
          </select>
          <p class="field-help">
            전체 탭 뒤에 선택한 카테고리가 카테고리 관리 정렬 순서대로 표시됩니다.
          </p>
        </div>
      </div>
    </AdminFormSection>

    <AdminFormSection
      title="상품 상세 배너"
      description="상품 상세 페이지의 상단과 하단에 노출할 배너 이미지를 설정합니다."
    >
      <div class="form-grid">
        <div class="form-row">
          <label>상단 배너 이미지</label>
          <ImageUploader
            v-model="globalForm.productDetailTopBannerImageUrl"
            path-prefix="products/detail-banners"
          />
        </div>
        <div class="form-row">
          <label>하단 배너 이미지</label>
          <ImageUploader
            v-model="globalForm.productDetailBottomBannerImageUrl"
            path-prefix="products/detail-banners"
          />
        </div>
      </div>
    </AdminFormSection>

    <AdminFormSection
      title="SEO 기본 설정"
      description="사이트 기본 메타 정보를 관리합니다."
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
          <label>캐노니컬 기본 도메인</label>
          <Input
            v-model="seoForm.canonicalBaseUrl"
            placeholder="https://example.com"
          />
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
import { buildCategoryTree } from "~/utils/category-tree";

const settingsStore = useSiteSettingsStore();
const productStore = useProductStore();
await Promise.all([
  settingsStore.fetchSettings(),
  productStore.fetchCatalog(true),
]);

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

const categoryOptions = computed(() =>
  buildCategoryTree(productStore.categories).map((category) => ({
    ...category,
    treeName: `${"— ".repeat(Math.max(0, category.depth - 1))}${category.name}`,
  })),
);

const submit = async () => {
  await settingsStore.saveGlobalSettings({
    ...globalForm,
    baseDeliveryFee: Number(globalForm.baseDeliveryFee || 0),
    homeCategoryTileIds: [...globalForm.homeCategoryTileIds],
    homeBestCategoryIds: [...globalForm.homeBestCategoryIds],
  });
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

.multi-select {
  min-height: 180px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  padding: 8px;
  color: var(--color-primary);
  font: inherit;
}

.multi-select option {
  padding: 8px;
}

.field-help {
  margin: 4px 0 0;
  color: var(--color-muted);
  font-size: 0.82rem;
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
