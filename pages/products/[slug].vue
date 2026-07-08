<template>
  <main class="section page-shell">
    <EmptyState
      v-if="!product"
      title="상품을 찾을 수 없어요."
      description="주소를 다시 확인해 주세요."
      action-label="상품 목록"
      action-to="/products"
    />
    <div v-else class="product-page">
      <div
        v-if="globalSettings.productDetailTopBannerImageUrl"
        class="detail-banner"
      >
        <img
          :src="globalSettings.productDetailTopBannerImageUrl"
          :alt="`${product.name} 상단 배너`"
        />
      </div>

      <div class="product-detail">
        <section class="gallery">
          <img
            v-if="selectedImage"
            :src="selectedImage"
            :alt="product.name"
            class="main-image"
          />
          <div v-else class="main-image image-empty">{{ product.name }}</div>
          <div v-if="galleryImages.length > 1" class="thumbs">
            <button
              v-for="image in galleryImages"
              :key="image"
              type="button"
              :class="{ active: selectedImage === image }"
              @click="selectedImage = image"
            >
              <img :src="image" :alt="product.name" />
            </button>
          </div>
        </section>

        <section class="surface buy-box">
          <p v-if="product.brandName" class="brand-name">
            {{ product.brandName }}
          </p>
          <div v-if="product.badges.length" class="badge-row">
            <ProductBadge
              v-for="badge in product.badges"
              :key="badge"
              :label="badge"
            />
          </div>
          <h1>{{ product.name }}</h1>
          <p class="short">{{ product.shortDescription }}</p>
          <ProductRatingSummary
            class="buy-rating"
            :product-id="product.id"
            size="md"
          />
          <PriceDisplay :product="product" :user="auth.profile" />
          <AdultGate v-if="product.isAdultOnly && !auth.isAdultVerified" />
          <template v-else>
            <div class="form-row">
              <label for="option">옵션</label>
              <Select id="option" v-model="optionId">
                <option
                  v-for="option in product.options"
                  :key="option.optionId"
                  :value="option.optionId"
                >
                  {{ option.optionName }} / 재고 {{ option.stock }}
                </option>
              </Select>
            </div>
            <div class="form-row quantity-row">
              <label>수량</label>
              <QuantityStepper
                v-model="quantity"
                :max="selectedOption?.stock || 1"
              />
            </div>
            <Button size="lg" :disabled="!canBuy" @click="addToCart">{{
              canBuy ? "장바구니 담기" : "구매 권한 확인 필요"
            }}</Button>
          </template>
        </section>

        <section class="surface detail-tabs">
          <div class="detail-tab-list" role="tablist" aria-label="상품 정보">
            <button
              v-for="tab in detailTabs"
              :id="tabId(tab.key)"
              :key="tab.key"
              type="button"
              role="tab"
              :class="{ active: activeDetailTab === tab.key }"
              :aria-selected="activeDetailTab === tab.key"
              :aria-controls="panelId(tab.key)"
              @click="activeDetailTab = tab.key"
            >
              <span>{{ tab.label }}</span>
              <strong v-if="typeof tab.count === 'number'">{{
                tab.count
              }}</strong>
            </button>
          </div>

          <div
            v-if="activeDetailTab === 'description'"
            :id="panelId('description')"
            class="detail-panel"
            role="tabpanel"
            :aria-labelledby="tabId('description')"
          >
            <MarkdownContent
              v-if="canBuy || !product.isAdultOnly"
              :content="description"
            />
            <p v-else class="restricted-copy">{{ description }}</p>
            <div v-if="product.detailImageUrls?.length" class="detail-images">
              <img
                v-for="image in product.detailImageUrls"
                :key="image"
                :src="image"
                :alt="product.name"
              />
            </div>
          </div>

          <ProductReviewList
            v-else-if="activeDetailTab === 'reviews'"
            :id="panelId('reviews')"
            class="detail-panel reviews-panel"
            :reviews="reviews"
            embedded
            role="tabpanel"
            :aria-labelledby="tabId('reviews')"
          />

          <div
            v-else
            :id="panelId('policy')"
            class="detail-panel policy-panel"
            role="tabpanel"
            :aria-labelledby="tabId('policy')"
          >
            <div class="policy-grid">
              <article>
                <h2>배송 안내</h2>
                <p>
                  결제 완료 후 상품 준비 및 출고가 진행됩니다. 배송비와 출고
                  일정은 주문서와 운영 정책에 따라 달라질 수 있습니다.
                </p>
              </article>
              <article>
                <h2>취소/환불 안내</h2>
                <p>
                  주문 취소, 교환, 반품, 환불은 상품 상태와 출고 여부를 확인한
                  뒤 취소/환불 정책 기준에 따라 처리됩니다.
                </p>
              </article>
            </div>
            <div class="policy-actions">
              <Button to="/guide" variant="ghost" size="sm">이용안내</Button>
              <Button to="/refund-policy" variant="ghost" size="sm">
                취소/환불 정책
              </Button>
            </div>
          </div>
        </section>
      </div>

      <div
        v-if="globalSettings.productDetailBottomBannerImageUrl"
        class="detail-banner"
      >
        <img
          :src="globalSettings.productDetailBottomBannerImageUrl"
          :alt="`${product.name} 하단 배너`"
        />
      </div>
      <Modal
        :open="cartPromptOpen"
        title="장바구니에 담았어요"
        @close="cartPromptOpen = false"
      >
        <div class="cart-confirm">
          <p>
            선택한 상품을 장바구니에 담았습니다. 계속 둘러보거나 장바구니로
            이동할 수 있어요.
          </p>
          <div class="cart-confirm__actions">
            <Button variant="ghost" @click="cartPromptOpen = false">
              계속 쇼핑하기
            </Button>
            <Button @click="goToCart">장바구니 보기</Button>
          </div>
        </div>
      </Modal>
    </div>
  </main>
</template>

<script setup lang="ts">
import {
  canBuyProduct,
  canViewProductWithCategories,
  maskRestrictedText,
} from "~/utils/access";
import type { Product } from "~/types/domain";

const route = useRoute();
const productStore = useProductStore();
const reviewStore = useProductReviewStore();
const cart = useCartStore();
const auth = useAuthStore();
const { data: seoSettings } = await useAsyncData(
  "site-seo-settings",
  () => $fetch("/api/site-settings/seo"),
  {
    default: () => ({
      defaultTitle: "BLEND ON",
      titleTemplate: "%s | BLEND ON",
      defaultDescription:
        "성인 취향을 쉽고 깔끔하게 고르는 라이프스타일 편집샵",
      defaultKeywords: ["성인 라이프스타일", "편집샵", "디바이스", "플레이버"],
      ogTitle: "BLEND ON",
      ogDescription: "성인 취향을 쉽고 깔끔하게 고르는 라이프스타일 편집샵",
      ogImageUrl: "/og-image.svg",
      canonicalBaseUrl: "",
      robots: "index,follow",
    }),
  },
);
const { data: globalSettings } = await useAsyncData(
  "site-global-settings",
  () => $fetch("/api/site-settings/global"),
  {
    default: () => ({
      productDetailTopBannerImageUrl: "",
      productDetailBottomBannerImageUrl: "",
    }),
  },
);
const { data: productSeo } = await useAsyncData(
  () => `product-seo-${route.params.slug}`,
  () => $fetch(`/api/products/seo/${String(route.params.slug)}`),
  { default: () => null },
);
const { data: serverProduct } = await useAsyncData(
  () => `product-detail-${route.params.slug}`,
  () =>
    $fetch<Product | null>(
      `/api/products/${encodeURIComponent(String(route.params.slug))}`,
    ),
  { default: () => null },
);
const rawProduct = computed(
  () =>
    productStore.findBySlug(String(route.params.slug)) || serverProduct.value,
);
const product = computed(() => {
  if (!rawProduct.value) return undefined;
  if (
    !productStore.initialized &&
    serverProduct.value?.id === rawProduct.value.id
  )
    return rawProduct.value;
  return canViewProductWithCategories(
    rawProduct.value,
    productStore.categories,
    auth.profile,
    productStore.gradeBenefits,
  )
    ? rawProduct.value
    : undefined;
});
const selectedImage = ref("");
const optionId = ref("");
const quantity = ref(1);
const cartPromptOpen = ref(false);
type DetailTabKey = "description" | "reviews" | "policy";
const activeDetailTab = ref<DetailTabKey>("description");
const galleryImages = computed(() => {
  if (!product.value) return [];
  return [
    ...new Set(
      [product.value.thumbnailUrl, ...product.value.imageUrls].filter(Boolean),
    ),
  ];
});
const selectedOption = computed(() =>
  product.value?.options.find((option) => option.optionId === optionId.value),
);
const canBuy = computed(() =>
  Boolean(
    product.value &&
    canBuyProduct(product.value, auth.profile, productStore.gradeBenefits),
  ),
);
const description = computed(() =>
  product.value ? maskRestrictedText(product.value, auth.profile) : "",
);
const reviews = computed(() =>
  product.value ? reviewStore.productReviews(product.value.id) : [],
);
const detailTabs = computed<
  Array<{ key: DetailTabKey; label: string; count?: number }>
>(() => [
  { key: "description", label: "상품 상세설명" },
  { key: "reviews", label: "리뷰", count: reviews.value.length },
  { key: "policy", label: "배송/환불 안내" },
]);

const tabId = (key: DetailTabKey) => `product-detail-tab-${key}`;
const panelId = (key: DetailTabKey) => `product-detail-panel-${key}`;

onMounted(async () => {
  await productStore.fetchCatalog();
});

watchEffect(() => {
  if (product.value) {
    if (!galleryImages.value.includes(selectedImage.value))
      selectedImage.value = galleryImages.value[0] || "";
    optionId.value ||= product.value.options[0]?.optionId || "";
  }
});

watch(
  () => product.value?.id,
  async (productId) => {
    if (productId) await reviewStore.fetchProductReviews(productId, true);
  },
  { immediate: true },
);

const addToCart = () => {
  if (!product.value) return;
  cart.add(product.value.id, optionId.value, quantity.value);
  cartPromptOpen.value = true;
};

const goToCart = () => {
  cartPromptOpen.value = false;
  navigateTo("/cart");
};

const absoluteUrl = (path: string | undefined) => {
  const base = seoSettings.value.canonicalBaseUrl.replace(/\/$/, "");
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return base ? `${base}${path.startsWith("/") ? path : `/${path}`}` : path;
};

useHead(() => {
  const item = product.value;
  const seo = productSeo.value;
  if (!item && !seo) return { title: "상품 상세" };
  const title = seo?.title || item?.seoTitle || item?.name || "상품 상세";
  const descriptionText =
    seo?.description ||
    item?.seoDescription ||
    item?.shortDescription ||
    seoSettings.value.defaultDescription;
  const keywords = seo?.keywords?.length
    ? seo.keywords
    : item?.seoKeywords?.length
      ? item.seoKeywords
      : item?.tags || seoSettings.value.defaultKeywords;
  const ogImage = seo?.ogImageUrl || item?.ogImageUrl || item?.thumbnailUrl;
  const canonicalPath =
    seo?.canonicalUrl || (item ? `/products/${item.slug}` : "");
  return {
    title,
    meta: [
      { name: "description", content: descriptionText },
      { name: "keywords", content: keywords.join(", ") },
      { property: "og:title", content: title },
      { property: "og:description", content: descriptionText },
      { property: "og:image", content: absoluteUrl(ogImage) },
    ],
    link: [
      {
        rel: "canonical",
        href: absoluteUrl(canonicalPath) || canonicalPath,
      },
    ],
  };
});
</script>

<style scoped>
.product-detail {
  display: grid;
  gap: 18px;
}

.product-page {
  display: grid;
  gap: 18px;
}

.detail-banner {
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
}

.detail-banner img {
  display: block;
  width: 100%;
  max-height: 280px;
  object-fit: cover;
}

.gallery {
  display: grid;
  width: 100%;
  gap: 10px;
  justify-self: center;
}

.main-image {
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  object-fit: cover;
}

.image-empty {
  display: grid;
  place-items: center;
  padding: 18px;
  color: var(--color-muted);
  font-weight: 900;
  text-align: center;
  word-break: keep-all;
}

.thumbs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.thumbs button {
  flex: 0 0 auto;
  width: 64px;
  height: 64px;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  padding: 0;
  cursor: pointer;
}

.thumbs button.active {
  border-color: var(--color-accent);
}

.thumbs img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.buy-box {
  display: grid;
  gap: 16px;
  padding: 20px;
}

.buy-box {
  align-self: start;
}

.buy-rating {
  margin-top: -6px;
}

.brand-name {
  margin: 0;
  color: #8d6b28;
  font-size: 13px;
  font-weight: 900;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.quantity-row {
  grid-template-columns: 64px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.quantity-row label {
  margin: 0;
}

.quantity-row :deep(.stepper) {
  width: 100%;
  grid-template-columns: 44px minmax(48px, 1fr) 44px;
  border-radius: 8px;
}

.quantity-row :deep(.stepper button) {
  width: 44px;
  height: 42px;
}

h1,
h2,
p {
  margin: 0;
}

.short {
  color: var(--color-muted);
  line-height: 1.55;
  word-break: keep-all;
}

.restricted-copy {
  color: var(--color-muted);
  line-height: 1.7;
  white-space: pre-wrap;
}

.detail-tabs {
  display: grid;
  overflow: hidden;
}

.detail-tab-list {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  border-bottom: 1px solid var(--color-line);
  padding: 8px;
}

.detail-tab-list button {
  display: inline-flex;
  flex: 0 0 auto;
  min-height: 42px;
  align-items: center;
  gap: 6px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-muted);
  padding: 0 14px;
  font-weight: 900;
  letter-spacing: 0;
  word-break: keep-all;
  cursor: pointer;
}

.detail-tab-list button.active {
  background: #fbf8f1;
  color: var(--color-primary);
}

.detail-tab-list strong {
  min-width: 22px;
  border-radius: 999px;
  background: var(--color-primary);
  color: #fff;
  padding: 3px 7px;
  font-size: 12px;
  line-height: 1;
  text-align: center;
}

.detail-panel {
  display: grid;
  min-width: 0;
  gap: 16px;
  padding: 20px;
}

.policy-grid {
  display: grid;
  gap: 14px;
}

.policy-grid article {
  display: grid;
  gap: 8px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  padding: 14px;
}

.policy-grid h2 {
  font-size: 17px;
}

.policy-grid p {
  color: var(--color-muted);
  line-height: 1.65;
  word-break: keep-all;
}

.policy-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cart-confirm {
  display: grid;
  gap: 16px;
}

.cart-confirm p {
  color: var(--color-muted);
  line-height: 1.65;
  word-break: keep-all;
}

.cart-confirm__actions {
  display: grid;
  gap: 8px;
}

.detail-images {
  display: grid;
  gap: 12px;
}

.detail-images img {
  width: 100%;
  border-radius: 8px;
}

.reviews-panel {
  min-width: 0;
}

@media (min-width: 900px) {
  .product-detail {
    grid-template-columns: minmax(360px, 560px) minmax(360px, 0.9fr);
    align-items: start;
    gap: 28px;
  }

  .detail-tabs {
    grid-column: 1 / -1;
  }

  .policy-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cart-confirm__actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
