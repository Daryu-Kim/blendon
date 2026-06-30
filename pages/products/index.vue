<template>
  <main class="section page-shell">
    <div class="section-title">
      <div>
        <h1>상품 목록</h1>
        <p>회원 등급과 상품 정책에 따라 볼 수 있는 상품이 달라집니다.</p>
      </div>
    </div>

    <div class="filters surface">
      <SearchBar />
      <Select v-model="categoryId" aria-label="카테고리">
        <option value="">전체 카테고리</option>
        <option v-for="category in productStore.rootCategories" :key="category.id" :value="category.id">
          {{ category.name }}
        </option>
      </Select>
    </div>

    <ProductGrid :products="productStore.filteredProducts" />
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const productStore = useProductStore()
const categoryId = computed({
  get: () => productStore.selectedCategoryId,
  set: (value) => productStore.setCategory(value)
})

onMounted(async () => {
  await productStore.fetchCatalog()
  if (route.query.q) productStore.setQuery(String(route.query.q))
  if (route.query.category) productStore.setCategory(String(route.query.category))
})

watch(
  () => route.query,
  (query) => {
    productStore.setQuery(query.q ? String(query.q) : productStore.query)
    productStore.setCategory(query.category ? String(query.category) : productStore.selectedCategoryId)
  }
)

useHead({ title: '상품 목록' })
</script>

<style scoped>
.filters {
  display: grid;
  gap: 12px;
  margin-bottom: 20px;
  padding: 14px;
}

@media (min-width: 760px) {
  .filters {
    grid-template-columns: minmax(0, 1fr) 240px;
    align-items: center;
  }
}
</style>
