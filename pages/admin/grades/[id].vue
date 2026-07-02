<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>회원 등급 수정</h1>
        <p>등급 혜택과 노출 상태를 변경합니다.</p>
      </div>
    </div>
    <EmptyState
      v-if="!grade"
      title="회원 등급을 찾을 수 없어요."
      description="목록에서 다시 선택해 주세요."
      action-label="등급 목록"
      action-to="/admin/grades"
    />
    <AdminGradeForm v-else :grade="grade" @saved="goList" />
  </main>
</template>

<script setup lang="ts">
import type { GradeBenefit } from "~/types/domain";

definePageMeta({ layout: "admin", middleware: "admin" });

const route = useRoute();
const productStore = useProductStore();
const grade = computed(() =>
  productStore.findGradeBenefit(String(route.params.id)),
);

onMounted(async () => {
  await productStore.fetchCatalog(true);
});

const goList = async (_grade: GradeBenefit) => {
  await navigateTo("/admin/grades");
};

useHead({ title: "관리자 회원 등급 수정" });
</script>
