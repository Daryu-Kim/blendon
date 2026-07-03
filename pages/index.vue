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
          <p>필요한 카테고리로 빠르게 이동하세요.</p>
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
          <p>지금 가장 먼저 확인하기 좋은 셀렉션입니다.</p>
        </div>
      </div>
      <nav class="best-tabs" aria-label="베스트 상품 바로가기">
        <NuxtLink v-for="tab in bestTabs" :key="tab.label" :to="tab.to">{{
          tab.label
        }}</NuxtLink>
      </nav>
      <ProductGrid :products="products.slice(0, 5)" />
    </section>

    <section class="page-shell promo-banner">
      <div>
        <p class="eyebrow">NICOTINE FREE</p>
        <h2>니코틴 없이 즐기는 향의 선택</h2>
        <p>부담은 낮추고, 취향은 더 선명하게.</p>
      </div>
      <Button to="/products?category=nicotine-free" variant="secondary"
        >니코틴 프리 보기</Button
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
            기본 배송부터 추후 매장 픽업과 라운지 픽업까지 확장할 수 있게
            설계합니다.
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
const productStore = useProductStore();
const products = computed(() => productStore.visibleProducts);

onMounted(async () => {
  await productStore.fetchCatalog();
});

const byCategory = (categoryId: string) =>
  products.value
    .filter((product) => product.categoryIds.includes(categoryId))
    .slice(0, 5);

const noticeItems = [
  {
    title: "ADULT ONLY",
    description: "성인 회원 전용 카테고리 운영",
    to: "/guide",
  },
  {
    title: "PICKUP READY",
    description: "매장 픽업 확장 준비 중",
    to: "/guide",
  },
  {
    title: "MEMBERSHIP",
    description: "등급별 혜택가 구조 적용",
    to: "/mypage",
  },
];

const categoryTiles = [
  {
    kicker: "DEVICE",
    title: "디바이스",
    description: "입문용부터 교체형까지",
    to: "/products?category=device",
  },
  {
    kicker: "FLAVOR",
    title: "플레이버",
    description: "향과 무드로 고르는 선택",
    to: "/products?category=flavor",
  },
  {
    kicker: "ZERO",
    title: "니코틴 프리",
    description: "니코틴 없이 즐기는 향",
    to: "/products?category=nicotine-free",
  },
  {
    kicker: "REFILL",
    title: "리필/소모품",
    description: "팟, 카트리지, 케이블",
    to: "/products?category=consumable",
  },
];

const bestTabs = [
  { label: "전체", to: "/products" },
  { label: "디바이스", to: "/products?category=device" },
  { label: "니코틴 프리", to: "/products?category=nicotine-free" },
  { label: "리필/소모품", to: "/products?category=consumable" },
];

const sections = computed(() => [
  {
    title: "오늘의 인기 상품",
    description: "지금 많이 확인하는 셀렉션입니다.",
    to: "/products",
    products: products.value.slice(0, 5),
  },
  {
    title: "처음이라면 이 상품부터",
    description: "구성, 호환성, 사용 흐름이 쉬운 상품을 모았어요.",
    to: "/products?category=starter-pick",
    products: byCategory("starter-pick"),
  },
  {
    title: "니코틴 프리 플레이버",
    description: "니코틴 없이 즐기는 향의 선택.",
    to: "/products?category=nicotine-free",
    products: byCategory("nicotine-free"),
  },
  {
    title: "리필/소모품",
    description: "팟, 카트리지, 케이블 등 필요한 구성입니다.",
    to: "/products?category=consumable",
    products: byCategory("consumable"),
  },
  {
    title: "라운지 픽",
    description: "오프라인 라운지 확장을 염두에 둔 큐레이션입니다.",
    to: "/products?category=lounge-pick",
    products: byCategory("lounge-pick"),
  },
  {
    title: "새로 들어온 상품",
    description: "최근 등록된 더미 상품 기준으로 보여줍니다.",
    to: "/products",
    products: [...products.value].reverse().slice(0, 5),
  },
  {
    title: "브랜드관",
    description: "가상 브랜드 셀렉션으로 구성된 초기 브랜드관입니다.",
    to: "/products?category=brand",
    products: products.value.slice(0, 5),
  },
]);

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
  min-height: 138px;
  align-content: end;
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

.best-tabs a {
  flex: 0 0 auto;
  border: 1px solid var(--color-line);
  border-radius: 999px;
  background: #fff;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 900;
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
