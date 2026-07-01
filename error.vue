<template>
  <NuxtLayout>
    <main class="section page-shell">
      <EmptyState
        title="페이지를 불러오지 못했어요."
        description="주소를 다시 확인하거나 홈으로 이동해 주세요."
        action-label="홈으로"
        action-to="/"
      />
    </main>
  </NuxtLayout>
</template>

<script setup lang="ts">
defineProps<{ error: { statusCode?: number; message?: string } }>();
</script>
