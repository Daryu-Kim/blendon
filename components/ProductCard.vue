<template>
  <article class="product-card surface">
    <NuxtLink :to="`/products/${product.slug}`" class="image-link">
      <img :src="product.thumbnailUrl" :alt="product.name" loading="lazy" />
      <span v-if="product.stock <= 10" class="stock-label">품절 임박</span>
    </NuxtLink>
    <div class="product-body">
      <span class="brand-name">{{ product.brandName }}</span>
      <div class="badge-row">
        <ProductBadge
          v-for="badge in product.badges.slice(0, 2)"
          :key="badge"
          :label="badge"
        />
      </div>
      <NuxtLink :to="`/products/${product.slug}`">
        <h3>{{ product.name }}</h3>
      </NuxtLink>
      <p>{{ product.shortDescription }}</p>
      <div class="card-footer">
        <PriceDisplay :product="product" :user="auth.profile" />
        <Button
          :to="`/products/${product.slug}`"
          :variant="canBuy ? 'primary' : 'ghost'"
          size="sm"
          :icon="canBuy ? ShoppingBag : LockKeyhole"
        >
          {{ canBuy ? "보기" : "확인" }}
        </Button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { LockKeyhole, ShoppingBag } from "@lucide/vue";
import type { Product } from "~/types/domain";
import { canBuyProduct } from "~/utils/access";

const props = defineProps<{ product: Product }>();
const auth = useAuthStore();
const productStore = useProductStore();
const canBuy = computed(() =>
  canBuyProduct(props.product, auth.profile, productStore.gradeBenefits),
);
</script>

<style scoped>
.product-card {
  display: grid;
  overflow: hidden;
  border-color: #efe6d8;
  box-shadow: none;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease;
}

.product-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-2px);
}

.image-link {
  position: relative;
  display: block;
  aspect-ratio: 1 / 1;
  background: #f9f5ec;
}

.image-link img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.stock-label {
  position: absolute;
  right: 10px;
  bottom: 10px;
  border-radius: 999px;
  background: var(--color-warning);
  color: #fff;
  padding: 6px 9px;
  font-size: 12px;
  font-weight: 900;
}

.product-body {
  display: grid;
  gap: 8px;
  padding: 13px;
}

.brand-name {
  color: #8d6b28;
  font-size: 12px;
  font-weight: 900;
}

.badge-row {
  display: flex;
  min-height: 24px;
  flex-wrap: wrap;
  gap: 6px;
}

h3 {
  margin: 0;
  font-size: 16px;
  line-height: 1.25;
}

p {
  display: -webkit-box;
  min-height: 38px;
  margin: 0;
  overflow: hidden;
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.card-footer {
  display: grid;
  gap: 10px;
  padding-top: 4px;
}
</style>
