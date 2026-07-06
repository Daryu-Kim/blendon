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
        <div class="form-row">
          <label>슬러그</label>
          <Input
            v-model="form.slug"
            placeholder="비워두면 제목 기준 자동 생성"
          />
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
          <Input
            v-model="form.linkUrl"
            placeholder="비워두면 연결 상품 또는 상품 목록으로 이동"
          />
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
      v-if="form.placement === 'home-main'"
      title="홈 메인 연결 상품"
      description="상품을 선택하면 홈 메인 배너 우측에 상품명과 대표 이미지가 노출됩니다."
    >
      <div class="form-grid">
        <div class="form-row wide">
          <label>상품 선택</label>
          <Select v-model="form.productId">
            <option value="">상품 연결 없음</option>
            <option
              v-for="product in productOptions"
              :key="product.id"
              :value="product.id"
            >
              {{ product.name }} / {{ product.slug }}
            </option>
          </Select>
        </div>

        <div v-if="selectedProduct" class="selected-product wide">
          <img
            v-if="selectedProduct.thumbnailUrl"
            :src="selectedProduct.thumbnailUrl"
            :alt="selectedProduct.name"
          >
          <div v-else class="selected-product__empty">이미지 없음</div>
          <div>
            <span>선택된 상품</span>
            <strong>{{ selectedProduct.name }}</strong>
            <p>{{ selectedProduct.shortDescription || selectedProduct.slug }}</p>
          </div>
        </div>
        <p v-else class="helper wide">
          상품을 연결하지 않으면 업로드한 배너 이미지를 사용합니다.
        </p>
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
const productStore = useProductStore();

const createEmptyBanner = (): Banner => ({
  id: "",
  slug: "",
  title: "",
  subtitle: "",
  imageUrl: "",
  buttonText: "바로가기",
  linkUrl: "",
  productId: "",
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

const productOptions = computed(() =>
  [...productStore.products]
    .filter((product) => product.status !== "deleted")
    .sort((a, b) => a.name.localeCompare(b.name, "ko")),
);

const selectedProduct = computed(() =>
  form.productId ? productStore.findById(form.productId) : null,
);

watch(
  () => form.placement,
  (placement) => {
    if (placement !== "home-main") form.productId = "";
  },
);

watch(
  () => form.productId,
  (productId, previousProductId) => {
    const product = productId ? productStore.findById(productId) : null;
    if (!product) return;
    const previousProduct = previousProductId
      ? productStore.findById(previousProductId)
      : null;
    const previousRoute = previousProduct
      ? `/products/${previousProduct.slug}`
      : "";
    if (!form.linkUrl || form.linkUrl === "/products" || form.linkUrl === previousRoute) {
      form.linkUrl = `/products/${product.slug}`;
    }
  },
);

const submit = async () => {
  const slug = form.slug.trim() || toSafeId(form.title);
  const banner: Banner = {
    ...form,
    id: form.id || `banner-${slug}-${Date.now()}`,
    slug,
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    imageUrl: form.imageUrl.trim(),
    buttonText: form.buttonText.trim(),
    linkUrl: form.linkUrl.trim(),
    productId: form.placement === "home-main" ? form.productId : "",
    order: Number(form.order || 0),
  };
  await bannerStore.upsertBanner(banner);
  emit("saved", banner);
};

onMounted(async () => {
  await productStore.fetchCatalog();
});
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

.helper {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
}

.selected-product {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  padding: 12px;
}

.selected-product img,
.selected-product__empty {
  width: 92px;
  aspect-ratio: 1;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  object-fit: cover;
}

.selected-product__empty {
  display: grid;
  place-items: center;
  background: var(--color-soft);
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 800;
}

.selected-product span {
  color: #8d6b28;
  font-size: 12px;
  font-weight: 900;
}

.selected-product strong {
  display: block;
  margin-top: 5px;
  font-size: 18px;
}

.selected-product p {
  margin: 6px 0 0;
  color: var(--color-muted);
  font-size: 14px;
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
