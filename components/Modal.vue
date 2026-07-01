<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="$emit('close')">
      <section
        class="modal surface"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <header>
          <h2>{{ title }}</h2>
          <button type="button" title="닫기" @click="$emit('close')">
            <X :size="18" />
          </button>
        </header>
        <slot />
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from "@lucide/vue";

defineProps<{ open: boolean; title: string }>();
defineEmits<{ close: [] }>();
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  background: rgba(23, 23, 23, 0.35);
  padding: 16px;
}

.modal {
  width: min(560px, 100%);
  max-height: min(720px, 90vh);
  overflow: auto;
  padding: 18px;
}

.modal header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.modal h2 {
  margin: 0;
  font-size: 20px;
}

.modal button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid var(--color-line);
  border-radius: 50%;
  background: #fff;
}
</style>
