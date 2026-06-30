<template>
  <nav class="category-nav" aria-label="상품 카테고리">
    <NuxtLink to="/products" :class="{ active: !activeCategoryId }">전체</NuxtLink>
    <NuxtLink
      v-for="category in categories"
      :key="category.id"
      :to="`/products?category=${category.id}`"
      :class="{ active: activeCategoryId === category.id }"
    >
      {{ category.name }}
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const productStore = useProductStore()
const route = useRoute()
const categories = computed(() => productStore.rootCategories)
const activeCategoryId = computed(() => (route.path === '/products' ? String(route.query.category || '') : ''))
</script>

<style scoped>
.category-nav {
  display: flex;
  gap: 18px;
  overflow-x: auto;
  padding: 0;
}

.category-nav a {
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  padding: 0 2px;
  font-size: 14px;
  font-weight: 900;
  white-space: nowrap;
}

.category-nav a::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  background: transparent;
  content: "";
}

.category-nav a:hover,
.category-nav a.active {
  color: #8d6b28;
}

.category-nav a:hover::after,
.category-nav a.active::after {
  background: var(--color-primary);
}
</style>
