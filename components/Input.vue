<template>
  <input class="ui-input" :value="modelValue" v-bind="$attrs" @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)" >
</template>

<script setup lang="ts">
defineProps<{ modelValue?: string | number }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<style scoped>
.ui-input {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  padding: 0 14px;
  color: var(--color-primary);
}

.ui-input:focus {
  outline: 2px solid rgba(214, 168, 90, 0.35);
  border-color: var(--color-accent);
}
</style>
