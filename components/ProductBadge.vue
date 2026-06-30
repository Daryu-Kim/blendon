<template>
  <span class="product-badge" :class="{ adult: label.includes('성인'), zero: label.includes('프리') }">{{ label }}</span>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<style scoped>
.product-badge {
  display: inline-flex;
  min-height: 24px;
  align-items: center;
  border-radius: 999px;
  background: #f3ead9;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 800;
}

.product-badge.adult {
  background: #171717;
  color: #fff;
}

.product-badge.zero {
  background: #e7f0ea;
}
</style>
