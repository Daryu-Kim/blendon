<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>쇼핑몰 설정 / SEO</h1>
        <p>기본 운영 정보와 사이트 공통 메타 정보를 관리합니다.</p>
      </div>
    </div>
    <AdminSiteSettingsForm />
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useHead({ title: "관리자 쇼핑몰 설정" });
</script>
