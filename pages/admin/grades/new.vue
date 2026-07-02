<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>회원 등급 추가</h1>
        <p>새 등급 혜택 정책을 등록합니다.</p>
      </div>
    </div>
    <AdminGradeForm @saved="goList" />
  </main>
</template>

<script setup lang="ts">
import type { GradeBenefit } from "~/types/domain";

definePageMeta({ layout: "admin", middleware: "admin" });

const goList = async (_grade: GradeBenefit) => {
  await navigateTo("/admin/grades");
};

useHead({ title: "관리자 회원 등급 추가" });
</script>
