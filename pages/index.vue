<template>
  <main class="shop-home">
    <section class="hero">
      <HomeHeroSwiper />
    </section>

    <section class="page-shell notice-strip" aria-label="쇼핑 안내">
      <NuxtLink v-for="item in noticeItems" :key="item.title" :to="item.to">
        <span>{{ item.title }}</span>
        <strong>{{ item.description }}</strong>
      </NuxtLink>
    </section>

    <section class="section page-shell quick-section">
      <div class="section-title center-title">
        <div>
          <h2>SHOP BY CATEGORY</h2>
          <p>디바이스, 무니코틴 액상, 소모품을 카테고리별로 살펴보세요.</p>
        </div>
      </div>
      <div class="category-tile-grid">
        <NuxtLink
          v-for="tile in categoryTiles"
          :key="tile.title"
          :to="tile.to"
          class="category-tile"
        >
          <span>{{ tile.kicker }}</span>
          <strong>{{ tile.title }}</strong>
          <p>{{ tile.description }}</p>
        </NuxtLink>
      </div>
    </section>

    <section class="section page-shell best-section">
      <div class="section-title center-title">
        <div>
          <h2>BEST PRODUCT</h2>
          <p>많이 찾는 상품을 카테고리별로 빠르게 확인하세요.</p>
        </div>
      </div>
      <nav class="best-tabs" aria-label="베스트 상품 카테고리 선택">
        <button
          v-for="tab in bestTabs"
          :key="tab.categoryId || 'all'"
          type="button"
          :class="{ active: activeBestCategoryId === tab.categoryId }"
          @click="activeBestCategoryId = tab.categoryId"
        >
          {{ tab.label }}
        </button>
      </nav>
      <ProductGrid :products="bestProducts" />
    </section>

    <section class="page-shell promo-banner">
      <div>
        <p class="eyebrow">NICOTINE FREE</p>
        <h2>무니코틴 액상으로 선명하게 고르는 취향</h2>
        <p>니코틴 없이 향과 쿨링감 중심으로 선택하세요.</p>
      </div>
      <Button to="/products?category=nicotine-free" variant="secondary"
        >무니코틴 액상 보기</Button
      >
    </section>

    <section
      v-for="section in sections"
      :key="section.title"
      class="section page-shell product-section"
    >
      <div class="section-title">
        <div>
          <h2>{{ section.title }}</h2>
          <p>{{ section.description }}</p>
        </div>
        <Button :to="section.to" variant="ghost" size="sm">더보기</Button>
      </div>
      <ProductGrid :products="section.products" />
    </section>

    <section class="band section">
      <div class="page-shell info-grid">
        <article>
          <span>01</span>
          <h2>성인 회원 이용 안내</h2>
          <p>
            성인 전용 상품은 회원가입 시 확인된 성인 회원만 상세 정보와 가격을
            확인할 수 있습니다.
          </p>
          <NuxtLink to="/guide">이용안내 보기</NuxtLink>
        </article>
        <article>
          <span>02</span>
          <h2>배송/픽업 안내</h2>
          <p>
            배송 주문과 매장 픽업 주문을 선택할 수 있으며, 주문 내역에서
            진행 상태를 확인할 수 있습니다.
          </p>
          <NuxtLink to="/guide">이용안내 보기</NuxtLink>
        </article>
        <article>
          <span>03</span>
          <h2>고객센터</h2>
          <p>상품, 주문, 회원 관련 문의를 남길 수 있습니다.</p>
          <NuxtLink to="/support">문의하기</NuxtLink>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { Category } from "~/types/domain";

const productStore = useProductStore();
const settingsStore = useSiteSettingsStore();
const products = computed(() => productStore.visibleProducts);
const activeBestCategoryId = ref("");

onMounted(async () => {
  await Promise.all([productStore.fetchCatalog(), settingsStore.fetchSettings()]);
});

const byCategory = (categoryId: string) =>
  products.value
    .filter((product) => product.categoryIds.includes(categoryId))
    .slice(0, 5);

const noticeItems = [
  {
    title: "ADULT ONLY",
    description: "성인 인증 후 이용 가능한 안전한 구매 환경",
    to: "/guide",
  },
  {
    title: "STORE PICKUP",
    description: "원하는 방식으로 선택하는 배송과 매장 픽업",
    to: "/guide",
  },
  {
    title: "MEMBERSHIP",
    description: "회원 등급별 혜택가와 적립 혜택 제공",
    to: "/mypage",
  },
];

const categoryMeta: Record<string, { kicker: string; description: string }> = {
  device: {
    kicker: "DEVICE",
    description: "기기 타입과 사용 방식에 맞춰 고르기",
  },
  flavor: {
    kicker: "FLAVOR",
    description: "향과 쿨링감 중심으로 살펴보기",
  },
  "nicotine-free": {
    kicker: "ZERO",
    description: "니코틴 없이 즐기는 무니코틴 액상",
  },
  consumable: {
    kicker: "REFILL",
    description: "팟, 카트리지, 코일 등 소모품",
  },
  brand: {
    kicker: "BRAND",
    description: "브랜드별 대표 상품 모아보기",
  },
  "starter-pick": {
    kicker: "STARTER",
    description: "처음 고르는 분을 위한 추천 구성",
  },
};

const findVisibleCategory = (categoryId: string) =>
  productStore.visibleCategories.find((category) => category.id === categoryId);

const categoryTo = (category: Category) =>
  `/products?category=${encodeURIComponent(productStore.categoryRouteValue(category))}`;

const categoryKicker = (category: Category) =>
  categoryMeta[category.id]?.kicker ||
  (category.slug || category.id).replace(/-/g, " ").toUpperCase();

const categoryDescription = (category: Category) =>
  categoryMeta[category.id]?.description ||
  (category.parentId
    ? "세부 카테고리별 상품을 빠르게 확인하세요."
    : "카테고리별 상품을 한눈에 확인하세요.");

const configuredHomeCategoryIds = computed(
  () => settingsStore.global.homeCategoryTileIds,
);
const configuredBestCategoryIds = computed(
  () => settingsStore.global.homeBestCategoryIds,
);

const categoryTiles = computed(() =>
  configuredHomeCategoryIds.value
    .map((categoryId) => findVisibleCategory(categoryId))
    .filter((category): category is Category => Boolean(category))
    .map((category) => ({
      kicker: categoryKicker(category),
      title: category.name,
      description: categoryDescription(category),
      categoryId: category.id,
      to: categoryTo(category),
    })),
);

const bestTabs = computed(() => {
  const categoryTabs = configuredBestCategoryIds.value
    .map((categoryId) => findVisibleCategory(categoryId))
    .filter((category): category is Category => Boolean(category))
    .map((category) => ({
      label: category.name,
      categoryId: category.id,
    }));
  return [{ label: "전체", categoryId: "" }, ...categoryTabs];
});

watch(
  bestTabs,
  (tabs) => {
    if (!tabs.some((tab) => tab.categoryId === activeBestCategoryId.value)) {
      activeBestCategoryId.value = "";
    }
  },
  { immediate: true },
);

const bestProducts = computed(() =>
  activeBestCategoryId.value
    ? byCategory(activeBestCategoryId.value)
    : products.value.slice(0, 5),
);

const sections = computed(() => [
  {
    title: "오늘의 인기 상품",
    description: "지금 많이 찾는 디바이스와 액상, 소모품을 모았습니다.",
    to: "/products",
    products: products.value.slice(0, 5),
  },
  {
    title: "처음이라면 이 상품부터",
    description: "구성과 호환성을 쉽게 확인할 수 있는 입문 추천 상품입니다.",
    to: "/products?category=starter-pick",
    products: byCategory("starter-pick"),
  },
  {
    title: "무니코틴 액상",
    description: "니코틴 없이 향과 쿨링감 중심으로 고르는 셀렉션입니다.",
    to: "/products?category=nicotine-free",
    products: byCategory("nicotine-free"),
  },
  {
    title: "리필/소모품",
    description: "팟, 카트리지, 코일 등 필요한 소모품을 모았습니다.",
    to: "/products?category=consumable",
    products: byCategory("consumable"),
  },
  {
    title: "매장 픽업 추천",
    description: "매장에서 직접 수령하기 좋은 상품을 확인하세요.",
    to: "/products?category=lounge-pick",
    products: byCategory("lounge-pick"),
  },
  {
    title: "새로 들어온 상품",
    description: "새롭게 입고된 상품을 가장 먼저 확인하세요.",
    to: "/products",
    products: [...products.value].reverse().slice(0, 5),
  },
  {
    title: "브랜드관",
    description: "브랜드별 취향과 대표 상품을 비교해 보세요.",
    to: "/products?category=brand",
    products: products.value.slice(0, 5),
  },
].filter((section) => !section.to.includes("category=") || section.products.length));

useHead({ title: "홈" });
</script>

<style scoped>
.shop-home {
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.72),
      rgba(247, 243, 234, 0) 340px
    ),
    var(--color-background);
}

.hero {
  padding: 18px 0 20px;
}

.notice-strip {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}

.notice-strip a {
  display: grid;
  gap: 4px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  padding: 13px 16px;
}

.notice-strip span {
  color: #8d6b28;
  font-size: 12px;
  font-weight: 900;
}

.notice-strip strong {
  font-size: 14px;
}

.center-title {
  justify-content: center;
  text-align: center;
}

.center-title h2 {
  letter-spacing: 0;
}

.category-tile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.category-tile {
  display: grid;
  min-height: 112px;
  align-content: center;
  gap: 6px;
  border: 1px solid #eadfcd;
  border-radius: 8px;
  background:
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.96),
      rgba(255, 255, 255, 0.76)
    ),
    linear-gradient(135deg, #f7f3ea, #e7efe9);
  padding: 16px;
}

.category-tile span {
  color: #8d6b28;
  font-size: 12px;
  font-weight: 900;
}

.category-tile strong {
  font-size: 21px;
}

.category-tile p {
  margin: 0;
  color: var(--color-muted);
  font-size: 14px;
}

.best-section {
  padding-top: 22px;
}

.best-tabs {
  display: flex;
  justify-content: center;
  gap: 8px;
  overflow-x: auto;
  margin: -4px 0 18px;
}

.best-tabs button {
  flex: 0 0 auto;
  border: 1px solid var(--color-line);
  border-radius: 999px;
  background: #fff;
  padding: 9px 14px;
  color: var(--color-primary);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 900;
}

.best-tabs button.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}

.promo-banner {
  display: grid;
  gap: 16px;
  align-items: center;
  border: 1px solid #eadfcd;
  border-radius: 8px;
  background: linear-gradient(135deg, #171717, #2a2926);
  padding: 24px;
  color: #fff;
}

.promo-banner h2,
.promo-banner p {
  margin: 0;
}

.promo-banner .eyebrow {
  color: var(--color-accent);
}

.promo-banner p:not(.eyebrow) {
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.72);
}

.product-section {
  border-top: 1px solid rgba(232, 223, 208, 0.7);
}

.info-grid {
  display: grid;
  gap: 14px;
}

.info-grid article {
  background: #fff;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  padding: 18px;
}

.info-grid span {
  display: inline-flex;
  margin-bottom: 12px;
  color: var(--color-accent);
  font-weight: 900;
}

.info-grid h2,
.info-grid p {
  margin: 0;
}

.info-grid p {
  margin-top: 8px;
  color: var(--color-muted);
}

.info-grid a {
  display: inline-flex;
  margin-top: 16px;
  font-weight: 900;
}

@media (min-width: 760px) {
  .notice-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .category-tile-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .promo-banner {
    grid-template-columns: minmax(0, 1fr) auto;
    padding: 30px 34px;
  }

  .info-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
