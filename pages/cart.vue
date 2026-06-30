<template>
  <main class="section page-shell">
    <div class="section-title">
      <div>
        <h1>장바구니</h1>
        <p>구매 전 상품 권한과 재고를 다시 확인합니다.</p>
      </div>
    </div>
    <CartPage />
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useHead({ title: '장바구니' })
</script>
