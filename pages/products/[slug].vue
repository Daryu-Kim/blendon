<template>
  <main class="section page-shell">
    <EmptyState
      v-if="!product"
      title="상품을 찾을 수 없어요."
      description="주소를 다시 확인해 주세요."
      action-label="상품 목록"
      action-to="/products"
    />
    <div v-else class="product-detail">
      <section class="gallery">
        <img :src="selectedImage" :alt="product.name" class="main-image" />
        <div class="thumbs">
          <button
            v-for="image in product.imageUrls"
            :key="image"
            type="button"
            @click="selectedImage = image"
          >
            <img :src="image" :alt="product.name" />
          </button>
        </div>
      </section>
      <section class="surface buy-box">
        <div class="badge-row">
          <ProductBadge
            v-for="badge in product.badges"
            :key="badge"
            :label="badge"
          />
        </div>
        <h1>{{ product.name }}</h1>
        <p class="short">{{ product.shortDescription }}</p>
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
          <div class="form-row">
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
      <section class="surface detail-copy">
        <h2>이런 분께 추천해요</h2>
        <p>{{ product.tags.join(", ") }}</p>
        <h2>확인해주세요</h2>
        <MarkdownContent v-if="canBuy || !product.isAdultOnly" :content="description" />
        <p v-else>{{ description }}</p>
        <div class="profile">
          <span>달콤함 {{ product.flavorProfile.sweetness }}/5</span>
          <span>쿨링 {{ product.flavorProfile.coolness }}/5</span>
          <span>바디 {{ product.flavorProfile.body }}/5</span>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { canBuyProduct, maskRestrictedText } from "~/utils/access";

const route = useRoute();
const productStore = useProductStore();
const cart = useCartStore();
const auth = useAuthStore();
const settingsStore = useSiteSettingsStore();
const product = computed(() =>
  productStore.findBySlug(String(route.params.slug)),
);
const selectedImage = ref("");
const optionId = ref("");
const quantity = ref(1);
const selectedOption = computed(() =>
  product.value?.options.find((option) => option.optionId === optionId.value),
);
const canBuy = computed(() =>
  Boolean(product.value && canBuyProduct(product.value, auth.profile)),
);
const description = computed(() =>
  product.value ? maskRestrictedText(product.value, auth.profile) : "",
);

onMounted(async () => {
  await Promise.all([
    productStore.fetchCatalog(),
    settingsStore.fetchSettings(),
  ]);
});

watchEffect(() => {
  if (product.value) {
    selectedImage.value ||=
      product.value.imageUrls[0] || product.value.thumbnailUrl;
    optionId.value ||= product.value.options[0]?.optionId || "";
  }
});

const addToCart = () => {
  if (!product.value) return;
  cart.add(product.value.id, optionId.value, quantity.value);
  navigateTo("/cart");
};

const absoluteUrl = (path: string | undefined) => {
  const base = settingsStore.seo.canonicalBaseUrl.replace(/\/$/, "");
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return base ? `${base}${path.startsWith("/") ? path : `/${path}`}` : path;
};

useHead(() => {
  const item = product.value;
  if (!item) return { title: "상품 상세" };
  const title = item.seoTitle || item.name;
  const descriptionText = item.seoDescription || item.shortDescription;
  const ogImage = item.ogImageUrl || item.thumbnailUrl;
  return {
    title,
    meta: [
      { name: "description", content: descriptionText },
      { name: "keywords", content: (item.seoKeywords || item.tags).join(", ") },
      { property: "og:title", content: title },
      { property: "og:description", content: descriptionText },
      { property: "og:image", content: absoluteUrl(ogImage) },
    ],
    link: [
      {
        rel: "canonical",
        href:
          item.canonicalUrl ||
          absoluteUrl(`/products/${item.slug}`) ||
          `/products/${item.slug}`,
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

.gallery {
  display: grid;
  gap: 10px;
}

.main-image {
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  object-fit: cover;
}

.thumbs {
  display: flex;
  gap: 8px;
}

.thumbs button {
  width: 64px;
  height: 64px;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  padding: 0;
}

.buy-box,
.detail-copy {
  display: grid;
  gap: 16px;
  padding: 20px;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

h1,
h2,
p {
  margin: 0;
}

.short {
  color: var(--color-muted);
}

.profile {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.profile span {
  border-radius: 999px;
  background: #f3ead9;
  padding: 8px 10px;
  font-weight: 800;
}

@media (min-width: 900px) {
  .product-detail {
    grid-template-columns: minmax(0, 1fr) 400px;
  }

  .detail-copy {
    grid-column: 1 / -1;
  }
}
</style>
