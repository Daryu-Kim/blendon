<template>
  <div v-if="products.length" class="product-grid">
    <ProductCard
      v-for="product in products"
      :key="product.id"
      :product="product"
    />
  </div>
  <EmptyState
    v-else
    title="조건에 맞는 상품이 없어요."
    description="검색어나 카테고리를 바꿔 다시 확인해 주세요."
    action-label="전체 상품 보기"
    action-to="/products"
  />
</template>

<script setup lang="ts">
import type { Product } from "~/types/domain";

const props = defineProps<{ products: Product[] }>();
const reviewStore = useProductReviewStore();
const productIds = computed(() =>
  props.products.map((product) => product.id).filter(Boolean),
);

watch(
  productIds,
  (ids) => {
    void reviewStore.fetchReviewSummaries(ids);
  },
  { immediate: true },
);
</script>

<style scoped>
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

@media (min-width: 760px) {
  .product-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }
}

@media (min-width: 1080px) {
  .product-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>
