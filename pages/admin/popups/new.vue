<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>공지 팝업 추가</h1>
        <p>사이트 진입 시 표시할 공지 모달을 작성합니다.</p>
      </div>
    </div>
    <AdminNoticePopupForm @saved="goList" />
  </main>
</template>

<script setup lang="ts">
import type { NoticePopup } from "~/types/domain";

const goList = async (_popup: NoticePopup) => {
  await navigateTo("/admin/popups");
};

definePageMeta({ layout: "admin", middleware: "admin" });
useHead({ title: "관리자 공지 팝업 추가" });
</script>
