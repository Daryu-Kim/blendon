<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>공지 추가</h1>
        <p>공지 제목과 마크다운 본문을 작성합니다.</p>
      </div>
    </div>
    <AdminNoticeForm @saved="goList" />
  </main>
</template>

<script setup lang="ts">
import type { Notice } from "~/types/domain";

definePageMeta({ layout: "admin", middleware: "admin" });

const goList = async (_notice: Notice) => {
  await navigateTo("/admin/notices");
};

useHead({ title: "관리자 공지 추가" });
</script>
