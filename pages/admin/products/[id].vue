<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>상품 수정</h1>
        <p>상품 정보와 정책을 변경합니다.</p>
      </div>
    </div>
    <EmptyState
      v-if="!product"
      title="상품을 찾을 수 없어요."
      description="목록에서 다시 선택해 주세요."
      action-label="상품 목록"
      action-to="/admin/products"
    />
    <AdminProductForm v-else :product="product" @saved="goList" />
  </main>
</template>

<script setup lang="ts">
import type { Product } from "~/types/domain";

definePageMeta({ layout: "admin", middleware: "admin" });

const route = useRoute();
const productStore = useProductStore();
const product = computed(() => productStore.findById(String(route.params.id)));

onMounted(async () => {
  await productStore.fetchCatalog();
});

const goList = async (_product: Product) => {
  await navigateTo("/admin/products");
};

useHead({ title: "관리자 상품 수정" });
</script>
