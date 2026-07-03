<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>카테고리 추가</h1>
        <p>카테고리 구조와 접근 가능한 최소 회원 등급을 설정합니다.</p>
      </div>
    </div>
    <AdminCategoryForm @saved="goList" />
  </main>
</template>

<script setup lang="ts">
import type { Category } from "~/types/domain";

definePageMeta({ layout: "admin", middleware: "admin" });

const productStore = useProductStore();

onMounted(async () => {
  await productStore.fetchCatalog(true);
});

const goList = async (_category: Category) => {
  await navigateTo("/admin/categories");
};

useHead({ title: "관리자 카테고리 추가" });
</script>
