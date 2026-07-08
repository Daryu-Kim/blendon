<template>
  <div
    class="rating-summary"
    :class="`rating-summary--${size}`"
    :aria-label="label"
  >
    <Star class="rating-summary__icon" :size="iconSize" aria-hidden="true" />
    <span>{{ average }}({{ count }})</span>
  </div>
</template>

<script setup lang="ts">
import { Star } from "@lucide/vue";

const props = withDefaults(
  defineProps<{
    productId: string;
    size?: "sm" | "md";
  }>(),
  {
    size: "sm",
  },
);

const reviewStore = useProductReviewStore();
const summary = computed(() => reviewStore.productSummary(props.productId));
const average = computed(() => summary.value.averageRating.toFixed(1));
const count = computed(() => summary.value.reviewCount);
const iconSize = computed(() => (props.size === "md" ? 17 : 14));
const label = computed(() => `별점 ${average.value}, 리뷰 ${count.value}개`);
</script>

<style scoped>
.rating-summary {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  align-items: center;
  gap: 4px;
  color: var(--color-muted);
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1.2;
  white-space: nowrap;
}

.rating-summary__icon {
  flex: 0 0 auto;
  color: var(--color-accent);
  fill: currentColor;
  stroke-width: 2.4;
}

.rating-summary--sm {
  font-size: 12px;
}

.rating-summary--md {
  font-size: 14px;
}
</style>
