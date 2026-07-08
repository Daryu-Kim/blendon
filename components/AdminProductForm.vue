<template>
  <form class="product-form" @submit.prevent="submit">
    <AdminFormSection
      title="기본 정보"
      description="상품명, 노출 문구, 브랜드와 md-editor-v3 기반 상세 설명을 설정합니다."
    >
      <div class="form-grid">
        <div class="form-row">
          <label>상품명</label><Input v-model="form.name" required />
        </div>
        <div class="form-row">
          <label>슬러그</label
          ><Input
            v-model="form.slug"
            placeholder="비워두면 상품명 기준 자동 생성"
          />
        </div>
        <div class="form-row">
          <label>브랜드명</label><Input v-model="form.brandName" />
        </div>
        <div class="form-row wide">
          <label>간단 설명</label><Input v-model="form.shortDescription" />
        </div>
        <div class="form-row wide">
          <label>상세 설명</label
          ><MarkdownEditor
            v-model="form.description"
            path-prefix="products/descriptions"
          />
        </div>
      </div>
    </AdminFormSection>

    <AdminFormSection
      title="카테고리"
      description="상품은 여러 카테고리에 동시에 연결할 수 있습니다."
    >
      <div class="form-grid">
        <div class="form-row wide">
          <label>카테고리 선택</label>
          <select v-model="form.categoryIds" class="multi-select" multiple>
            <option
              v-for="category in categoryOptions"
              :key="category.id"
              :value="category.id"
            >
              {{ category.treeName }}
            </option>
          </select>
          <p class="field-help">
            Ctrl 또는 Command 키를 누른 상태로 여러 카테고리를 선택할 수
            있습니다.
          </p>
        </div>
        <div v-if="selectedCategories.length" class="selected-chip-row wide">
          <button
            v-for="category in selectedCategories"
            :key="category.id"
            type="button"
            class="selected-chip"
            @click="removeCategory(category.id)"
          >
            {{ category.treeName }} ×
          </button>
        </div>
      </div>
    </AdminFormSection>

    <AdminFormSection
      title="이미지"
      description="대표 이미지는 상품 카드에, 갤러리 이미지는 상품 상세 상단 이미지 목록에 사용합니다. 상세 본문 이미지는 md-editor-v3에서 업로드합니다."
    >
      <div class="form-grid">
        <div class="form-row">
          <label>대표 이미지</label
          ><ImageUploader
            v-model="form.thumbnailUrl"
            path-prefix="products/thumbnails"
          />
        </div>
        <div class="form-row wide">
          <label>목록/갤러리 이미지 URL</label
          ><Textarea v-model="imageUrlsText" rows="3" />
        </div>
      </div>
    </AdminFormSection>

    <AdminFormSection
      title="가격/재고/혜택"
      description="회원 등급별 고정가를 비우면 회원가와 등급 할인율로 혜택가를 계산합니다."
    >
      <div class="form-grid">
        <div class="form-row">
          <label>기본가</label
          ><Input v-model="form.basePrice" type="number" min="0" required />
        </div>
        <div class="form-row">
          <label>회원가</label
          ><Input v-model="form.memberPrice" type="number" min="0" required />
        </div>
        <div class="form-row">
          <label>정가</label
          ><Input v-model="compareAtPriceText" type="number" min="0" />
        </div>
        <div class="form-row">
          <label>등급 할인 제외</label>
          <Select v-model="gradeDiscountExcludedText">
            <option value="false">아니오</option>
            <option value="true">예</option>
          </Select>
        </div>
        <div v-if="form.isGradeDiscountExcluded" class="form-row wide">
          <label>할인 제외 사유</label>
          <Input
            v-model="form.discountExcludedReason"
            placeholder="예: 특가, 세트, 정가 고정 상품"
          />
        </div>
        <div class="form-row">
          <label>재고</label
          ><Input v-model="form.stock" type="number" min="0" required />
        </div>
        <template v-if="!form.isGradeDiscountExcluded">
          <div
            v-for="benefit in activeGradeBenefits"
            :key="benefit.gradeCode"
            class="form-row"
          >
            <label>{{ benefit.label }} 고정가</label>
            <Input
              v-model="gradePriceTexts[benefit.gradeCode]"
              type="number"
              min="0"
              placeholder="자동 할인"
            />
          </div>
        </template>
      </div>
    </AdminFormSection>

    <AdminFormSection
      title="성인/권한 정책"
      description="쇼핑몰은 성인 전용으로 운영하며, 등급별 열람/구매 권한을 함께 관리합니다."
    >
      <div class="form-grid">
        <div class="form-row">
          <label>상태</label
          ><Select v-model="form.status"
            ><option value="draft">임시저장</option>
            <option value="active">판매중</option>
            <option value="hidden">숨김</option>
            <option value="soldOut">품절</option>
            <option value="deleted">삭제</option></Select
          >
        </div>
        <div class="form-row">
          <label>노출</label
          ><Select v-model="visibleText"
            ><option value="true">노출</option>
            <option value="false">숨김</option></Select
          >
        </div>
        <div class="form-row">
          <label>성인 전용</label
          ><Select v-model="adultOnlyText"
            ><option value="true">예</option>
            <option value="false">아니오</option></Select
          >
        </div>
        <div class="form-row">
          <label>최소 열람 등급</label
          ><Select v-model="form.minUserGradeToView">
            <option
              v-for="grade in accessGradeOptions"
              :key="grade.gradeCode"
              :value="grade.gradeCode"
            >
              {{ grade.label }}
            </option>
          </Select>
        </div>
        <div class="form-row">
          <label>표시 최소 등급</label
          ><Select v-model="form.displayMinUserGradeToView">
            <option
              v-for="grade in accessGradeOptions"
              :key="grade.gradeCode"
              :value="grade.gradeCode"
            >
              {{ grade.label }}
            </option>
          </Select>
        </div>
        <div class="form-row">
          <label>최소 구매 등급</label
          ><Select v-model="form.minUserGradeToBuy">
            <option
              v-for="grade in accessGradeOptions"
              :key="grade.gradeCode"
              :value="grade.gradeCode"
            >
              {{ grade.label }}
            </option>
          </Select>
        </div>
        <div class="form-row">
          <label>로그인 전 가격 숨김</label
          ><Select v-model="hideBeforeLoginText"
            ><option value="true">숨김</option>
            <option value="false">표시</option></Select
          >
        </div>
        <div class="form-row">
          <label>성인 확인 전 가격 숨김</label
          ><Select v-model="hideBeforeAdultText"
            ><option value="true">숨김</option>
            <option value="false">표시</option></Select
          >
        </div>
      </div>
    </AdminFormSection>

    <AdminFormSection
      title="속성/옵션"
      description="상품 속성과 구매 옵션을 관리합니다."
    >
      <div class="form-grid">
        <div class="form-row">
          <label>디바이스 타입</label
          ><Select v-model="form.deviceType"
            ><option value="mtl">입호흡</option>
            <option value="dtl">폐호흡</option>
            <option value="disposable">일회용</option>
            <option value="common">공통</option>
            <option value="not_applicable">해당 없음</option></Select
          >
        </div>
        <div class="form-row">
          <label>성분 타입</label
          ><Select v-model="form.nicotineType"
            ><option value="none">무니코틴</option>
            <option value="alternative">대체 니코틴</option>
            <option value="synthetic">합성 니코틴</option>
            <option value="not_applicable">기기/소모품</option></Select
          >
        </div>
        <div class="form-row wide">
          <label>배지</label
          ><Input v-model="badgesText" placeholder="쉼표로 구분" />
        </div>
        <div class="form-row wide">
          <div class="label-row">
            <label>태그</label>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              :disabled="generatingTags"
              @click="generateProductKeywords('tag')"
              >자동완성</Button
            >
          </div>
          <Input
            v-model="tagsText"
            placeholder="내부 검색용 태그, 쉼표로 구분"
          />
        </div>
        <AdminProductOptionsEditor v-model="form.options" class="wide" />
        <div class="form-row wide">
          <label>관리자 메모</label
          ><Textarea v-model="form.adminMemo" rows="3" />
        </div>
      </div>
    </AdminFormSection>

    <AdminFormSection
      title="상품 SEO"
      description="상품 상세 페이지의 외부 검색/공유 메타 정보를 설정합니다."
    >
      <div class="form-grid">
        <div class="form-row wide">
          <label>SEO 타이틀</label>
          <Input v-model="form.seoTitle" :placeholder="seoTitlePlaceholder" />
        </div>
        <div class="form-row wide">
          <label>SEO 설명</label>
          <Input
            v-model="form.seoDescription"
            placeholder="비워두면 간단 설명 사용"
          />
        </div>
        <div class="form-row wide">
          <div class="label-row">
            <label>SEO 키워드</label>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              :disabled="generatingSeoKeywords"
              @click="generateProductKeywords('seo')"
              >자동완성</Button
            >
          </div>
          <Input
            v-model="seoKeywordsText"
            placeholder="외부 검색용 키워드, 쉼표로 구분"
          />
        </div>
        <div class="form-row">
          <label>OG 이미지</label>
          <ImageUploader v-model="form.ogImageUrl" path-prefix="products/seo" />
        </div>
        <div class="form-row">
          <label>캐노니컬 URL</label>
          <Input v-model="form.canonicalUrl" placeholder="비워두면 자동 생성" />
        </div>
      </div>
    </AdminFormSection>

    <div class="sticky-actions">
      <Button type="button" variant="ghost" to="/admin/products">목록</Button>
      <Button type="submit">저장</Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Product, ProductOption } from "~/types/domain";
import { buildCategoryTree } from "~/utils/category-tree";
import { toUserMessage } from "~/utils/error-message";
import { toSafeId } from "~/utils/format";
import { PUBLIC_ACCESS_GRADE } from "~/utils/access";

const props = defineProps<{ product?: Product | null }>();
const emit = defineEmits<{ saved: [product: Product] }>();

type KeywordMode = "seo" | "tag";

const productStore = useProductStore();
const { brand } = useAppConfig();
const now = new Date().toISOString();
const fallbackGrades = [
  { gradeCode: "BASIC", label: "BASIC", level: 1, order: 1 },
  { gradeCode: "PLUS", label: "PLUS", level: 3, order: 2 },
  { gradeCode: "PRO", label: "PRO", level: 5, order: 3 },
  { gradeCode: "VIP", label: "VIP", level: 8, order: 4 },
  { gradeCode: "BLACK", label: "BLACK", level: 10, order: 5 },
];
const activeGradeBenefits = computed(() => {
  const grades = productStore.gradeBenefits
    .filter((grade) => grade.isVisible)
    .sort((a, b) => a.level - b.level || a.order - b.order)
    .map((grade) => ({
      gradeCode: grade.gradeCode,
      label: grade.label,
      level: grade.level,
      order: grade.order,
    }));
  return grades.length ? grades : fallbackGrades;
});
const lowestGradeCode = computed(
  () => activeGradeBenefits.value[0]?.gradeCode || "BASIC",
);
const accessGradeOptions = computed(() => [
  { gradeCode: PUBLIC_ACCESS_GRADE, label: "전체 공개", level: 0, order: 0 },
  ...activeGradeBenefits.value.map((grade) => ({
    ...grade,
    label: `${grade.label} 이상 (${grade.gradeCode})`,
  })),
]);

const defaultOption = (): ProductOption => ({
  optionId: "default",
  optionName: "기본",
  optionCode: "DEFAULT",
  additionalPrice: 0,
  stock: 0,
  isActive: true,
});

const createEmptyProduct = (): Product => ({
  id: "",
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  categoryIds: [],
  brandName: "",
  thumbnailUrl: "",
  imageUrls: [],
  basePrice: 0,
  memberPrice: 0,
  compareAtPrice: null,
  gradePrices: {},
  isGradeDiscountExcluded: false,
  discountExcludedReason: "",
  stock: 0,
  options: [defaultOption()],
  badges: [],
  tags: [],
  flavorProfile: { sweetness: 0, coolness: 0, body: 0, mood: [], notes: [] },
  deviceType: "not_applicable",
  nicotineType: "not_applicable",
  isNicotineFree: false,
  isAlternativeNicotine: false,
  isAdultOnly: true,
  isVisible: true,
  minUserGradeToView: PUBLIC_ACCESS_GRADE,
  displayMinUserGradeToView: PUBLIC_ACCESS_GRADE,
  minUserGradeToBuy: "BASIC",
  isPriceHiddenBeforeLogin: true,
  isPriceHiddenBeforeAdultVerification: true,
  status: "draft",
  detailImageUrls: [],
  viewRoles: [],
  buyRoles: [],
  seoTitle: "",
  seoDescription: "",
  seoKeywords: [],
  ogImageUrl: "",
  canonicalUrl: "",
  adminMemo: "",
  createdAt: now,
  updatedAt: now,
});

const form = reactive<Product>(
  props.product
    ? JSON.parse(JSON.stringify(props.product))
    : createEmptyProduct(),
);
const imageUrlsText = ref((form.imageUrls || []).join("\n"));
const detailImageUrlsText = ref((form.detailImageUrls || []).join("\n"));
const badgesText = ref((form.badges || []).join(", "));
const tagsText = ref((form.tags || []).join(", "));
const seoKeywordsText = ref((form.seoKeywords || []).join(", "));
const generatingSeoKeywords = ref(false);
const generatingTags = ref(false);
const compareAtPriceText = ref(
  form.compareAtPrice ? String(form.compareAtPrice) : "",
);
const gradePriceTexts = ref<Record<string, string>>(
  Object.fromEntries(
    Object.entries(form.gradePrices || {}).map(([gradeCode, price]) => [
      gradeCode,
      String(price || ""),
    ]),
  ),
);

const visibleText = computed({
  get: () => String(form.isVisible),
  set: (value) => {
    form.isVisible = value === "true";
  },
});
const hideBeforeLoginText = computed({
  get: () => String(form.isPriceHiddenBeforeLogin),
  set: (value) => {
    form.isPriceHiddenBeforeLogin = value === "true";
  },
});
const hideBeforeAdultText = computed({
  get: () => String(form.isPriceHiddenBeforeAdultVerification),
  set: (value) => {
    form.isPriceHiddenBeforeAdultVerification = value === "true";
  },
});
const adultOnlyText = computed({
  get: () => String(form.isAdultOnly),
  set: (value) => {
    form.isAdultOnly = value === "true";
    form.isPriceHiddenBeforeAdultVerification = value === "true";
  },
});
const gradeDiscountExcludedText = computed({
  get: () => String(Boolean(form.isGradeDiscountExcluded)),
  set: (value) => {
    form.isGradeDiscountExcluded = value === "true";
    if (!form.isGradeDiscountExcluded) form.discountExcludedReason = "";
  },
});
const seoTitlePlaceholder = computed(() =>
  form.name.trim()
    ? `${form.name.trim()} | ${brand.name}`
    : `상품명 | ${brand.name}`,
);
const categoryOptions = computed(() =>
  buildCategoryTree(productStore.categories).map((category) => ({
    ...category,
    treeName: `${"— ".repeat(Math.max(0, category.depth - 1))}${category.name}`,
  })),
);
const selectedCategories = computed(() =>
  categoryOptions.value.filter((category) =>
    form.categoryIds.includes(category.id),
  ),
);
const categoryNameMap = computed(
  () =>
    new Map(
      productStore.categories.map((category) => [category.id, category.name]),
    ),
);

const splitLines = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
const splitComma = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
const normalizeOptions = (options: ProductOption[]) =>
  (options.length ? options : [defaultOption()]).map((option, index) => {
    const optionName =
      String(option.optionName || "").trim() ||
      (index === 0 ? "기본" : `옵션 ${index + 1}`);
    const optionCode =
      String(option.optionCode || "").trim() ||
      toSafeId(optionName).toUpperCase();
    return {
      optionId: option.optionId || `option-${toSafeId(optionName)}-${index}`,
      optionName,
      optionCode,
      additionalPrice: Math.max(0, Number(option.additionalPrice || 0)),
      stock: Math.max(0, Number(option.stock || 0)),
      isActive: option.isActive !== false,
    };
  });

const removeCategory = (categoryId: string) => {
  form.categoryIds = form.categoryIds.filter((id) => id !== categoryId);
};

const generateProductKeywords = async (mode: KeywordMode) => {
  if (!form.name.trim()) {
    alert("상품명을 먼저 입력해 주세요.");
    return;
  }

  const loadingText =
    mode === "seo"
      ? "SEO 키워드를 생성하는 중"
      : "내부 검색 태그를 생성하는 중";
  const loading = useGlobalLoading();
  const firebase = useNuxtApp().$firebase;
  const token = await firebase.auth?.currentUser?.getIdToken();
  if (!token) {
    alert("관리자 로그인이 필요합니다.");
    return;
  }

  if (mode === "seo") generatingSeoKeywords.value = true;
  else generatingTags.value = true;

  try {
    const result = await loading.withLoading(
      () =>
        $fetch<{ keywords: string }>("/api/admin/ai/product-keywords", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: {
            mode,
            product: {
              name: form.name,
              shortDescription: form.shortDescription,
              description: form.description,
              brandName: form.brandName,
              categoryNames: form.categoryIds.map(
                (id) => categoryNameMap.value.get(id) || id,
              ),
              deviceType: form.deviceType,
              nicotineType: form.nicotineType,
              badges: splitComma(badgesText.value),
              tags: splitComma(tagsText.value),
            },
          },
        }),
      loadingText,
    );

    if (mode === "seo") seoKeywordsText.value = result.keywords;
    else tagsText.value = result.keywords;
  } catch (error) {
    alert(toUserMessage(error, "키워드 자동완성에 실패했어요."));
  } finally {
    generatingSeoKeywords.value = false;
    generatingTags.value = false;
  }
};

const submit = async () => {
  const id = form.id || `product-${toSafeId(form.name)}`;
  const gradePrices: NonNullable<Product["gradePrices"]> = {};
  activeGradeBenefits.value.forEach((grade) => {
    const value = Number(gradePriceTexts.value[grade.gradeCode] || 0);
    if (value > 0) gradePrices[grade.gradeCode] = value;
  });
  const product: Product = {
    ...form,
    id,
    slug: form.slug || toSafeId(form.name),
    basePrice: Number(form.basePrice || 0),
    memberPrice: Number(form.memberPrice || form.basePrice || 0),
    compareAtPrice: compareAtPriceText.value
      ? Number(compareAtPriceText.value)
      : null,
    gradePrices: form.isGradeDiscountExcluded ? {} : gradePrices,
    isGradeDiscountExcluded: Boolean(form.isGradeDiscountExcluded),
    discountExcludedReason: form.isGradeDiscountExcluded
      ? (form.discountExcludedReason || "").trim()
      : "",
    stock: Number(form.stock || 0),
    imageUrls: splitLines(imageUrlsText.value || form.thumbnailUrl),
    detailImageUrls: splitLines(detailImageUrlsText.value),
    badges: splitComma(badgesText.value),
    tags: splitComma(tagsText.value),
    seoKeywords: splitComma(seoKeywordsText.value),
    seoTitle: (form.seoTitle || "").trim() || seoTitlePlaceholder.value,
    seoDescription:
      (form.seoDescription || "").trim() || form.shortDescription.trim(),
    options: normalizeOptions(form.options),
    isNicotineFree: form.nicotineType === "none",
    isAlternativeNicotine:
      form.nicotineType === "alternative" || form.nicotineType === "synthetic",
    minUserGradeLevel:
      form.minUserGradeToView === PUBLIC_ACCESS_GRADE
        ? 0
        : productStore.findGradeBenefit(form.minUserGradeToView)?.level || 1,
    displayMinUserGradeToView:
      form.displayMinUserGradeToView || form.minUserGradeToView,
    minUserGradeToBuyLevel:
      form.minUserGradeToBuy === PUBLIC_ACCESS_GRADE
        ? 0
        : productStore.findGradeBenefit(form.minUserGradeToBuy)?.level || 1,
    createdAt: form.createdAt || now,
    updatedAt: new Date().toISOString(),
  };
  await productStore.upsertProduct(product);
  emit("saved", product);
};

onMounted(async () => {
  await productStore.fetchCatalog();
  if (!props.product) {
    form.minUserGradeToView = PUBLIC_ACCESS_GRADE;
    form.displayMinUserGradeToView = PUBLIC_ACCESS_GRADE;
    form.minUserGradeToBuy = lowestGradeCode.value;
    return;
  }
  if (!form.minUserGradeToView) form.minUserGradeToView = PUBLIC_ACCESS_GRADE;
  if (!form.displayMinUserGradeToView)
    form.displayMinUserGradeToView = form.minUserGradeToView;
  if (!form.minUserGradeToBuy) form.minUserGradeToBuy = lowestGradeCode.value;
});
</script>

<style scoped>
.product-form {
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

.selected-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-chip {
  border: 1px solid var(--color-line);
  border-radius: 999px;
  background: #fff;
  padding: 7px 10px;
  color: var(--color-primary);
  cursor: pointer;
  font-weight: 800;
}

.selected-chip:hover {
  border-color: var(--color-accent);
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
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
