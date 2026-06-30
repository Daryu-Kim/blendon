<template>
  <div class="empty-state surface">
    <PackageOpen :size="42" aria-hidden="true" />
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <Button v-if="actionTo && actionLabel" :to="actionTo">{{ actionLabel }}</Button>
  </div>
</template>

<script setup lang="ts">
import { PackageOpen } from '@lucide/vue'

defineProps<{ title: string; description: string; actionLabel?: string; actionTo?: string }>()
</script>

<style scoped>
.empty-state {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 36px 20px;
  text-align: center;
}

.empty-state h2,
.empty-state p {
  margin: 0;
}

.empty-state p {
  color: var(--color-muted);
}
</style>
