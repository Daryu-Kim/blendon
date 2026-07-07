<template>
  <div class="page-shell">
    <Swiper
      class="hero-swiper"
      :modules="swiperModules"
      :slides-per-view="1"
      :loop="true"
      :speed="620"
      :autoplay="{ delay: 5200, disableOnInteraction: false }"
      :pagination="{ clickable: true }"
      :navigation="{
        prevEl: '.hero-nav--prev',
        nextEl: '.hero-nav--next',
      }"
    >
      <SwiperSlide v-for="slide in heroSlides" :key="slide.id">
        <div
          class="hero-stage"
          :class="[
            `hero-stage--${slide.tone}`,
            { 'hero-stage--has-visual': slide.visualImageUrl },
          ]"
        >
          <div class="hero-copy">
            <p class="eyebrow">{{ slide.kicker }}</p>
            <h1>{{ slide.title }}</h1>
            <p>{{ slide.description }}</p>
            <div class="hero-actions">
              <Button :to="slide.primaryTo" size="lg">{{
                slide.primaryLabel
              }}</Button>
              <Button
                v-if="slide.secondaryTo && slide.secondaryLabel"
                :to="slide.secondaryTo"
                variant="ghost"
                size="lg"
              >
                {{ slide.secondaryLabel }}
              </Button>
            </div>
          </div>

          <div v-if="slide.visualImageUrl" class="hero-visual" aria-hidden="true">
            <img
              :src="slide.visualImageUrl"
              :alt="slide.product?.name || slide.title"
            >
            <div v-if="slide.product" class="hero-product">
              <span>{{ slide.productKicker }}</span>
              <strong>{{ slide.product.name }}</strong>
              <p>{{ slide.product.shortDescription }}</p>
            </div>
          </div>
        </div>
      </SwiperSlide>
      <button
        class="hero-nav hero-nav--prev"
        type="button"
        aria-label="이전 배너"
      >
        <ChevronLeft :size="22" aria-hidden="true" />
      </button>
      <button
        class="hero-nav hero-nav--next"
        type="button"
        aria-label="다음 배너"
      >
        <ChevronRight :size="22" aria-hidden="true" />
      </button>
    </Swiper>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "@lucide/vue";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/css";
import "swiper/css/pagination";
import type { Product } from "~/types/domain";

const { brand } = useAppConfig();
const productStore = useProductStore();
const bannerStore = useBannerStore();
const products = computed(() => productStore.visibleProducts);
const featured = computed(
  () =>
    products.value.find((product) =>
      product.categoryIds.includes("starter-pick"),
    ) || products.value[0],
);
const swiperModules = [Autoplay, Navigation, Pagination];

const firstByCategory = (categoryId: string) =>
  products.value.find((product) => product.categoryIds.includes(categoryId)) ||
  featured.value;

const findVisibleProductById = (productId: string) =>
  products.value.find((product) => product.id === productId);

const productImageUrl = (product?: Product) =>
  product?.thumbnailUrl || product?.imageUrls?.[0] || "";

const productRoute = (product?: Product) =>
  product ? `/products/${product.slug}` : "";

interface HeroSlide {
  id: string;
  kicker: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryTo: string;
  secondaryLabel?: string;
  secondaryTo?: string;
  productKicker: string;
  product?: Product;
  imageUrl?: string;
  visualImageUrl: string;
  tone: "cream" | "green" | "amber";
}

onMounted(async () => {
  await bannerStore.fetchBanners();
});

const defaultSlides = computed<HeroSlide[]>(() => [
  {
    id: "editorial-main",
    kicker: brand.slogan,
    title: `취향을 블렌딩하다, ${brand.name}`,
    description:
      "디바이스, 무니코틴 액상, 소모품을 취향과 사용 방식에 맞춰 고르는 성인 전용 셀렉션입니다.",
    primaryLabel: "인기 상품 보기",
    primaryTo: "/products",
    secondaryLabel: "입문 추천 보기",
    secondaryTo: "/products?category=starter-pick",
    productKicker: "STARTER PICK",
    product: firstByCategory("starter-pick"),
    visualImageUrl: productImageUrl(firstByCategory("starter-pick")),
    tone: "cream",
  },
  {
    id: "nicotine-free",
    kicker: "NICOTINE FREE",
    title: "무니코틴 액상으로 고르는 취향",
    description:
      "니코틴 없이 향과 쿨링감 중심으로 데일리하게 고르기 좋은 셀렉션입니다.",
    primaryLabel: "무니코틴 액상 보기",
    primaryTo: "/products?category=nicotine-free",
    secondaryLabel: "데일리 추천",
    secondaryTo: "/products?category=starter-pick",
    productKicker: "ZERO FLAVOR",
    product: firstByCategory("nicotine-free"),
    visualImageUrl: productImageUrl(firstByCategory("nicotine-free")),
    tone: "green",
  },
  {
    id: "refill-care",
    kicker: "REFILL & CARE",
    title: "필요한 소모품을 깔끔하게",
    description:
      "팟, 카트리지, 케이블까지 사용하는 디바이스에 맞춰 빠르게 확인하세요.",
    primaryLabel: "리필/소모품 보기",
    primaryTo: "/products?category=consumable",
    secondaryLabel: "전체 상품",
    secondaryTo: "/products",
    productKicker: "DAILY REFILL",
    product: firstByCategory("consumable"),
    visualImageUrl: productImageUrl(firstByCategory("consumable")),
    tone: "amber",
  },
]);

const heroSlides = computed<HeroSlide[]>(() => {
  if (!bannerStore.activeHomeMainBanners.length) return defaultSlides.value;
  return bannerStore.activeHomeMainBanners.map((banner, index) => {
    const product = banner.productId
      ? findVisibleProductById(banner.productId)
      : undefined;
    return {
      id: banner.id,
      kicker: brand.slogan,
      title: banner.title,
      description: banner.subtitle,
      primaryLabel: banner.buttonText || "바로가기",
      primaryTo: banner.linkUrl || productRoute(product) || "/products",
      productKicker: "BLEND ON PICK",
      product,
      imageUrl: banner.imageUrl,
      visualImageUrl: productImageUrl(product) || banner.imageUrl,
      tone: (["cream", "green", "amber"][index % 3] || "cream") as
        | "cream"
        | "green"
        | "amber",
    };
  });
});
</script>

<style scoped>
.hero-swiper {
  --swiper-theme-color: var(--color-primary);
  --swiper-navigation-size: 20px;
  border: 1px solid #eadfcd;
  border-radius: 8px;
  background: #fffaf0;
}

.hero-swiper :deep(.swiper-wrapper) {
  align-items: stretch;
}

.hero-swiper :deep(.swiper-slide) {
  height: auto;
}

.hero-nav {
  position: absolute;
  top: 50%;
  z-index: 5;
  display: none;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(23, 23, 23, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--color-primary);
  box-shadow: 0 10px 28px rgba(23, 23, 23, 0.08);
  cursor: pointer;
  transform: translateY(-50%);
  backdrop-filter: blur(10px);
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}

.hero-nav:hover {
  border-color: rgba(23, 23, 23, 0.28);
  background: #fff;
  transform: translateY(-50%) scale(1.04);
}

.hero-nav--prev {
  left: 18px;
}

.hero-nav--next {
  right: 18px;
}

.hero-nav.swiper-button-disabled {
  cursor: default;
  opacity: 0.35;
}

.hero-swiper :deep(.swiper-pagination) {
  bottom: 16px;
}

.hero-swiper :deep(.swiper-pagination-bullet) {
  width: 22px;
  height: 4px;
  border-radius: 999px;
  background: rgba(23, 23, 23, 0.32);
  opacity: 1;
}

.hero-swiper :deep(.swiper-pagination-bullet-active) {
  background: var(--color-accent);
}

.hero-stage {
  position: relative;
  display: grid;
  min-height: 390px;
  overflow: hidden;
  overflow-wrap: break-word;
  word-break: keep-all;
  background:
    radial-gradient(
      circle at 82% 28%,
      rgba(214, 168, 90, 0.34),
      transparent 30%
    ),
    linear-gradient(135deg, #fffaf0 0%, #f3ead9 52%, #e7efe9 100%);
}

.hero-stage--green {
  background:
    radial-gradient(
      circle at 82% 28%,
      rgba(143, 174, 157, 0.38),
      transparent 30%
    ),
    linear-gradient(135deg, #fbfff8 0%, #edf5ed 52%, #fff7e6 100%);
}

.hero-stage--amber {
  background:
    radial-gradient(
      circle at 82% 28%,
      rgba(232, 111, 97, 0.2),
      transparent 30%
    ),
    linear-gradient(135deg, #fffaf0 0%, #f7ebcf 48%, #f7f3ea 100%);
}

.hero-copy {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 16px;
  align-content: center;
  padding: 34px 24px;
}

.hero-copy h1 {
  max-width: 720px;
  margin: 0;
  font-size: clamp(38px, 8vw, 76px);
  line-height: 1.02;
}

.hero-copy > p:not(.eyebrow) {
  max-width: 560px;
  margin: 0;
  color: var(--color-muted);
  font-size: 18px;
  line-height: 1.55;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-visual {
  display: none;
}

.hero-product {
  position: absolute;
  right: 28px;
  bottom: 28px;
  width: min(280px, 34vw);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  padding: 16px;
  backdrop-filter: blur(12px);
}

.hero-product span {
  color: #8d6b28;
  font-size: 12px;
  font-weight: 900;
}

.hero-product strong {
  display: block;
  margin-top: 6px;
  font-size: 20px;
}

.hero-product p {
  margin: 6px 0 0;
  color: var(--color-muted);
}

@media (min-width: 900px) {
  .hero-stage--has-visual {
    grid-template-columns: minmax(0, 1fr) 42%;
  }

  .hero-copy {
    padding: 58px;
  }

  .hero-nav {
    display: flex;
  }

  .hero-visual {
    position: relative;
    display: block;
  }

  .hero-visual > img {
    position: absolute;
    right: 70px;
    bottom: 78px;
    width: min(340px, 28vw);
    border-radius: 8px;
    box-shadow: var(--shadow-md);
    transform: rotate(-3deg);
  }
}
</style>
