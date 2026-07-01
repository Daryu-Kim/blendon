<template>
  <div
    v-if="messages.length"
    class="toast-stack"
    aria-live="polite"
    aria-atomic="true"
  >
    <div
      v-for="toast in messages"
      :key="toast.id"
      class="toast"
      :class="`toast--${toast.type}`"
    >
      <span>{{ toast.message }}</span>
      <button type="button" aria-label="알림 닫기" @click="remove(toast.id)">
        ×
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { messages, remove } = useToast();
</script>

<style scoped>
.toast-stack {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1000;
  display: grid;
  width: min(360px, calc(100vw - 32px));
  gap: 10px;
}

.toast {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(23, 23, 23, 0.12);
  border-left: 4px solid var(--color-accent);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: var(--shadow-md);
  padding: 13px 12px 13px 14px;
  color: var(--color-primary);
  backdrop-filter: blur(12px);
}

.toast--error,
.toast--warning {
  border-left-color: var(--color-warning);
}

.toast--success {
  border-left-color: var(--color-secondary-accent);
}

.toast span {
  font-size: 14px;
  font-weight: 800;
  line-height: 1.45;
}

.toast button {
  display: inline-grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: #f4efe6;
  color: var(--color-muted);
  font-size: 18px;
  line-height: 1;
}
</style>
