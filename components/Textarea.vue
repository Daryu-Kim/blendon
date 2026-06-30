<template>
  <textarea class="ui-textarea" :value="modelValue" v-bind="$attrs" @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)" />
</template>

<script setup lang="ts">
defineProps<{ modelValue?: string }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<style scoped>
.ui-textarea {
  width: 100%;
  min-height: 120px;
  resize: vertical;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  padding: 12px 14px;
}
</style>
