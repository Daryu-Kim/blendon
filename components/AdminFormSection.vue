<template>
  <section class="admin-form-section surface">
    <header>
      <h2>{{ title }}</h2>
      <p v-if="description">{{ description }}</p>
    </header>
    <div class="form-grid">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ title: string; description?: string }>();
</script>

<style scoped>
.admin-form-section {
  display: grid;
  gap: 16px;
  padding: 18px;
}

h2,
p {
  margin: 0;
}

p {
  margin-top: 4px;
  color: var(--color-muted);
}
</style>
