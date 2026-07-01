<template>
  <div v-if="show" class="loading-overlay">
    <div class="loading-panel" role="status" aria-live="polite">
      <div class="loader" />
      <span>{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ show: boolean; label?: string }>(), {
  label: "처리 중",
});
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  background: rgba(247, 243, 234, 0.7);
  backdrop-filter: blur(6px);
}

.loading-panel {
  display: grid;
  place-items: center;
  gap: 12px;
  min-width: 160px;
  border: 1px solid rgba(214, 168, 90, 0.32);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.86);
  padding: 22px 24px;
  box-shadow: var(--shadow-sm);
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
