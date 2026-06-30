<template>
  <div v-if="show" class="loading-overlay">
    <div class="loader" />
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ show: boolean; label?: string }>(), {
  label: '처리 중'
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  gap: 10px;
  background: rgba(247, 243, 234, 0.7);
  backdrop-filter: blur(6px);
  font-weight: 800;
}

.loader {
  width: 42px;
  height: 42px;
  border: 4px solid #fff;
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
