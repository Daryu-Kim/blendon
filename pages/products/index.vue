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
      <Select v-model="categorySlug" aria-label="카테고리">
        <option value="">전체 카테고리</option>
        <option
          v-for="category in categoryOptions"
          :key="category.id"
          :value="category.routeValue"
        >
          {{ category.label }}
        </option>
      </Select>
    </div>

    <EmptyState
      v-if="selectedCategoryIsRestricted"
      title="접근할 수 없는 카테고리입니다."
      description="회원 등급 조건을 충족한 뒤 이용할 수 있어요."
      action-label="전체 상품 보기"
      action-to="/products"
    />
    <ProductGrid v-else :products="productStore.filteredProducts" />
  </main>
</template>

<script setup lang="ts">
import { buildCategoryTree } from "~/utils/category-tree";

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
const categorySlug = computed({
  get: () => {
    const category = productStore.visibleCategories.find(
      (item) => item.id === productStore.selectedCategoryId,
    );
    return category ? productStore.categoryRouteValue(category) : "";
  },
  set: async (value) => {
    productStore.setCategoryFromRoute(value);
    const nextQuery = { ...route.query };
    if (value) nextQuery.category = value;
    else delete nextQuery.category;
    await router.push({ path: "/products", query: nextQuery });
  },
});
const categoryOptions = computed(() =>
  buildCategoryTree(productStore.visibleCategories).map((category) => ({
    ...category,
    label: `${"— ".repeat(Math.max(0, category.depth - 1))}${category.name}`,
    routeValue: productStore.categoryRouteValue(category),
  })),
);
const selectedCategoryIsRestricted = computed(
  () =>
    Boolean(productStore.selectedCategoryId) &&
    !productStore.visibleCategories.some(
      (category) => category.id === productStore.selectedCategoryId,
    ),
);

onMounted(async () => {
  await productStore.fetchCatalog();
  if (route.query.q) productStore.setQuery(String(route.query.q));
  if (route.query.category)
    productStore.setCategoryFromRoute(String(route.query.category));
});

watch(
  () => route.query,
  (query) => {
    productStore.setQuery(query.q ? String(query.q) : productStore.query);
    productStore.setCategoryFromRoute(
      query.category ? String(query.category) : "",
    );
  },
);

useHead({ title: "상품 목록" });
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
