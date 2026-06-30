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
      :navigation="true"
    >
      <SwiperSlide v-for="slide in heroSlides" :key="slide.id">
        <div class="hero-stage" :class="`hero-stage--${slide.tone}`">
          <div class="hero-copy">
            <p class="eyebrow">{{ slide.kicker }}</p>
            <h1>{{ slide.title }}</h1>
            <p>{{ slide.description }}</p>
            <div class="hero-actions">
              <Button :to="slide.primaryTo" size="lg">{{ slide.primaryLabel }}</Button>
              <Button :to="slide.secondaryTo" variant="ghost" size="lg">{{ slide.secondaryLabel }}</Button>
            </div>
          </div>

          <div class="hero-visual" aria-hidden="true">
            <img :src="slide.product?.thumbnailUrl || featured?.thumbnailUrl" :alt="slide.product?.name || featured?.name || ''" >
            <div class="hero-product">
              <span>{{ slide.productKicker }}</span>
              <strong>{{ slide.product?.name || featured?.name }}</strong>
              <p>{{ slide.product?.shortDescription || featured?.shortDescription }}</p>
            </div>
          </div>
        </div>
      </SwiperSlide>
    </Swiper>
  </div>
</template>

<script setup lang="ts">
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const { brand } = useAppConfig()
const productStore = useProductStore()
const products = computed(() => productStore.visibleProducts)
const featured = computed(() => products.value.find((product) => product.categoryIds.includes('lounge-pick')) || products.value[0])
const swiperModules = [Autoplay, Navigation, Pagination]

const firstByCategory = (categoryId: string) => products.value.find((product) => product.categoryIds.includes(categoryId)) || featured.value

// 홈 메인 배너는 추후 Firestore banners 컬렉션과 연결할 수 있도록 데이터 배열로 분리한다.
const heroSlides = computed(() => [
  {
    id: 'editorial-main',
    kicker: brand.slogan,
    title: `취향을 블렌딩하다, ${brand.name}`,
    description: '향, 맛, 무드를 쉽고 깔끔하게 고르는 성인 라이프스타일 편집샵.',
    primaryLabel: '인기 상품 보기',
    primaryTo: '/products',
    secondaryLabel: '입문 추천 보기',
    secondaryTo: '/products?category=starter-pick',
    productKicker: 'LOUNGE PICK',
    product: firstByCategory('lounge-pick'),
    tone: 'cream'
  },
  {
    id: 'nicotine-free',
    kicker: 'NICOTINE FREE',
    title: '니코틴 없이 즐기는 향의 선택',
    description: '부담은 낮추고, 취향은 더 선명하게. 데일리하게 고르기 좋은 플레이버를 모았습니다.',
    primaryLabel: '니코틴 프리 보기',
    primaryTo: '/products?category=nicotine-free',
    secondaryLabel: '데일리 추천',
    secondaryTo: '/products?category=starter-pick',
    productKicker: 'ZERO FLAVOR',
    product: firstByCategory('nicotine-free'),
    tone: 'green'
  },
  {
    id: 'refill-care',
    kicker: 'REFILL & CARE',
    title: '필요한 소모품을 깔끔하게',
    description: '팟, 카트리지, 케이블까지 사용하는 디바이스에 맞춰 빠르게 확인하세요.',
    primaryLabel: '리필/소모품 보기',
    primaryTo: '/products?category=consumable',
    secondaryLabel: '전체 상품',
    secondaryTo: '/products',
    productKicker: 'DAILY REFILL',
    product: firstByCategory('consumable'),
    tone: 'amber'
  }
])
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

.hero-swiper :deep(.swiper-button-prev),
.hero-swiper :deep(.swiper-button-next) {
  display: none;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(23, 23, 23, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--color-primary);
  backdrop-filter: blur(10px);
}

.hero-swiper :deep(.swiper-button-prev)::after,
.hero-swiper :deep(.swiper-button-next)::after {
  font-weight: 900;
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
  background:
    radial-gradient(circle at 82% 28%, rgba(214, 168, 90, 0.34), transparent 30%),
    linear-gradient(135deg, #fffaf0 0%, #f3ead9 52%, #e7efe9 100%);
}

.hero-stage--green {
  background:
    radial-gradient(circle at 82% 28%, rgba(143, 174, 157, 0.38), transparent 30%),
    linear-gradient(135deg, #fbfff8 0%, #edf5ed 52%, #fff7e6 100%);
}

.hero-stage--amber {
  background:
    radial-gradient(circle at 82% 28%, rgba(232, 111, 97, 0.2), transparent 30%),
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
  .hero-stage {
    grid-template-columns: minmax(0, 1fr) 42%;
  }

  .hero-copy {
    padding: 58px;
  }

  .hero-swiper :deep(.swiper-button-prev),
  .hero-swiper :deep(.swiper-button-next) {
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
