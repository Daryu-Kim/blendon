<template>
  <div class="stepper" aria-label="수량 선택">
    <button
      type="button"
      :disabled="modelValue <= min"
      @click="update(modelValue - 1)"
    >
      -
    </button>
    <span>{{ modelValue }}</span>
    <button
      type="button"
      :disabled="modelValue >= max"
      @click="update(modelValue + 1)"
    >
      +
    </button>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{ modelValue: number; min?: number; max?: number }>(),
  {
    min: 1,
    max: 99,
  },
);
const emit = defineEmits<{ "update:modelValue": [value: number] }>();
const update = (value: number) =>
  emit("update:modelValue", Math.min(props.max, Math.max(props.min, value)));
</script>

<style scoped>
.stepper {
  display: inline-grid;
  grid-template-columns: 38px 42px 38px;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 999px;
  background: #fff;
}

.stepper button {
  width: 38px;
  height: 38px;
  border: 0;
  background: transparent;
  font-weight: 900;
}

.stepper span {
  text-align: center;
  font-weight: 800;
}
</style>
