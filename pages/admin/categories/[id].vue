<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>카테고리 수정</h1>
        <p>카테고리 구조, 노출 상태, 등급 접근 권한을 변경합니다.</p>
      </div>
    </div>
    <EmptyState
      v-if="!category"
      title="카테고리를 찾을 수 없어요."
      description="목록에서 다시 선택해 주세요."
      action-label="카테고리 목록"
      action-to="/admin/categories"
    />
    <AdminCategoryForm v-else :category="category" @saved="goList" />
  </main>
</template>

<script setup lang="ts">
import type { Category } from "~/types/domain";

definePageMeta({ layout: "admin", middleware: "admin" });

const route = useRoute();
const productStore = useProductStore();
const category = computed(() =>
  productStore.categories.find((item) => item.id === String(route.params.id)),
);

onMounted(async () => {
  await productStore.fetchCatalog(true);
});

const goList = async (_category: Category) => {
  await navigateTo("/admin/categories");
};

useHead({ title: "관리자 카테고리 수정" });
</script>
