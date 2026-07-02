<template>
  <div class="price-display">
    <p v-if="hidden" class="hidden-price">{{ message }}</p>
    <template v-else>
      <div class="price-row">
        <strong>{{ formatCurrency(price) }}</strong>
        <span v-if="rate > 0">{{ rate }}%</span>
      </div>
      <del v-if="product.compareAtPrice">{{
        formatCurrency(product.compareAtPrice)
      }}</del>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Product, UserProfile } from "~/types/domain";
import {
  currentUnitPrice,
  discountRate,
  shouldHidePrice,
} from "~/utils/access";
import { formatCurrency } from "~/utils/format";

const props = defineProps<{ product: Product; user?: UserProfile | null }>();
const hidden = computed(() => shouldHidePrice(props.product, props.user));
const price = computed(() => currentUnitPrice(props.product, props.user));
const rate = computed(() => discountRate(props.product, props.user));
const message = computed(() => {
  if (!props.user) return "로그인 후 혜택가 확인";
  if (props.product.isAdultOnly && !props.user.isAdultVerified)
    return "회원 확인 후 혜택가 확인";
  return "권한 확인 후 가격 확인";
});
</script>

<style scoped>
.price-display {
  display: grid;
  gap: 3px;
}

.price-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-row strong {
  font-size: 20px;
}

.price-row span {
  color: var(--color-warning);
  font-weight: 900;
}

del,
.hidden-price {
  margin: 0;
  color: var(--color-muted);
  font-size: 14px;
}
</style>
