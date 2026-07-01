<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>상품 추가</h1>
        <p>상품 정보, 이미지, 가격, 등급별 권한을 등록합니다.</p>
      </div>
    </div>
    <AdminProductForm @saved="goList" />
  </main>
</template>

<script setup lang="ts">
import type { Product } from "~/types/domain";

definePageMeta({ layout: "admin", middleware: "admin" });

const goList = async (_product: Product) => {
  await navigateTo("/admin/products");
};

useHead({ title: "관리자 상품 추가" });
</script>
