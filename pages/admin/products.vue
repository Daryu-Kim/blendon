<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>상품 관리</h1>
        <p>상품을 검색하고 노출, 재고, 권한 상태를 빠르게 확인합니다.</p>
      </div>
      <Button to="/admin/products/new" variant="secondary">상품 추가</Button>
    </div>

    <section class="surface product-search">
      <Input v-model="keyword" placeholder="상품명, 브랜드, 태그 검색" />
      <Select v-model="status">
        <option value="">전체 상태</option>
        <option value="draft">임시저장</option>
        <option value="active">판매중</option>
        <option value="hidden">숨김</option>
        <option value="soldOut">품절</option>
        <option value="deleted">삭제</option>
      </Select>
      <Select v-model="categoryId">
        <option value="">전체 카테고리</option>
        <option
          v-for="category in productStore.categories"
          :key="category.id"
          :value="category.id"
        >
          {{ category.name }}
        </option>
      </Select>
    </section>

    <AdminTable :rows="filteredProducts" :columns="columns" row-key="id">
      <template #thumbnailUrl="{ row }">
        <img class="thumb" :src="row.thumbnailUrl" :alt="row.name" />
      </template>
      <template #memberPrice="{ row }">{{
        formatCurrency(row.memberPrice)
      }}</template>
      <template #stock="{ row }"
        ><span :class="{ danger: row.stock <= 10 }">{{
          row.stock
        }}</span></template
      >
      <template #isVisible="{ row }">{{
        row.isVisible ? "노출" : "숨김"
      }}</template>
      <template #minUserGradeToView="{ row }">
        <span
          >{{ row.isAdultOnly ? "성인" : "일반" }} /
          {{ row.minUserGradeToView }}+</span
        >
      </template>
      <template #actions="{ row }">
        <div class="row-actions">
          <Button size="sm" variant="ghost" :to="`/admin/products/${row.id}`"
            >수정</Button
          >
          <Button
            size="sm"
            variant="ghost"
            @click="productStore.toggleVisibility(row.id)"
            >노출전환</Button
          >
          <Button
            size="sm"
            variant="danger"
            @click="productStore.softDeleteProduct(row.id)"
            >삭제</Button
          >
        </div>
      </template>
    </AdminTable>
  </main>
</template>

<script setup lang="ts">
import { formatCurrency } from "~/utils/format";

definePageMeta({ layout: "admin", middleware: "admin" });

const productStore = useProductStore();
const keyword = ref("");
const status = ref("");
const categoryId = ref("");

const columns = [
  { key: "thumbnailUrl", label: "이미지" },
  { key: "name", label: "상품명" },
  { key: "memberPrice", label: "회원가" },
  { key: "stock", label: "재고" },
  { key: "isVisible", label: "노출" },
  { key: "status", label: "상태" },
  { key: "minUserGradeToView", label: "권한" },
] as const;

const filteredProducts = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  return productStore.products.filter((product) => {
    const matchesKeyword =
      !q ||
      product.name.toLowerCase().includes(q) ||
      product.brandName.toLowerCase().includes(q) ||
      product.tags.some((tag) => tag.toLowerCase().includes(q));
    const matchesStatus = !status.value || product.status === status.value;
    const matchesCategory =
      !categoryId.value || product.categoryIds.includes(categoryId.value);
    return matchesKeyword && matchesStatus && matchesCategory;
  });
});

onMounted(async () => {
  await productStore.fetchCatalog();
});

useHead({ title: "관리자 상품 관리" });
</script>

<style scoped>
.product-search {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
  padding: 14px;
}

.thumb {
  width: 48px;
  height: 48px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  object-fit: cover;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.danger {
  color: var(--color-warning);
  font-weight: 900;
}

@media (min-width: 960px) {
  .product-search {
    grid-template-columns: minmax(0, 1fr) 180px 220px;
  }
}
</style>
