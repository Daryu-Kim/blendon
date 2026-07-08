<template>
  <article class="product-card surface">
    <NuxtLink :to="`/products/${product.slug}`" class="image-link">
      <img
        v-if="product.thumbnailUrl"
        :src="product.thumbnailUrl"
        :alt="product.name"
        loading="lazy"
      />
      <div v-else class="image-placeholder">
        {{ product.name }}
      </div>
      <span v-if="product.stock <= 10" class="stock-label">품절 임박</span>
    </NuxtLink>
    <div class="product-body">
      <div class="product-heading">
        <span v-if="product.brandName" class="brand-name">
          {{ product.brandName }}
        </span>
        <NuxtLink :to="`/products/${product.slug}`" class="name-link">
          <h3>{{ product.name }}</h3>
        </NuxtLink>
      </div>
      <ProductRatingSummary class="card-rating" :product-id="product.id" />
      <div v-if="product.badges.length" class="badge-row">
        <ProductBadge
          v-for="badge in product.badges"
          :key="badge"
          :label="badge"
        />
      </div>
      <p v-if="product.shortDescription">{{ product.shortDescription }}</p>
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
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
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

.image-placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  padding: 16px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 900;
  line-height: 1.35;
  text-align: center;
  word-break: keep-all;
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
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 9px;
  padding: 12px;
}

.product-heading {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.brand-name {
  color: #8d6b28;
  font-size: 11px;
  font-weight: 900;
  line-height: 1.2;
}

.name-link {
  min-width: 0;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.card-rating {
  margin-top: -2px;
}

.badge-row :deep(.product-badge) {
  min-height: 22px;
  padding: 3px 7px;
  font-size: 11px;
}

h3 {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  font-size: 16px;
  line-height: 1.28;
  overflow-wrap: break-word;
  word-break: keep-all;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.38;
  word-break: keep-all;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.card-footer {
  display: grid;
  gap: 8px;
  margin-top: auto;
  padding-top: 1px;
}

.card-footer :deep(.price-display) {
  gap: 2px;
}

.card-footer :deep(.price-row strong) {
  font-size: 18px;
  line-height: 1.2;
}

.card-footer :deep(.hidden-price) {
  line-height: 1.35;
  word-break: keep-all;
}

@media (min-width: 760px) {
  .card-footer {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
  }
}
</style>
