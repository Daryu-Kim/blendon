<template>
  <select class="ui-select" :value="modelValue" v-bind="$attrs" @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)">
    <slot />
  </select>
</template>

<script setup lang="ts">
defineProps<{ modelValue?: string | number }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<style scoped>
.ui-select {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  padding: 0 14px;
}
</style>
