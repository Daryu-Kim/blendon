<template>
  <NuxtLink
    v-if="to"
    v-bind="$attrs"
    :to="to"
    :class="classes"
    :aria-disabled="disabled"
  >
    <component :is="icon" v-if="icon" :size="18" aria-hidden="true" />
    <slot />
  </NuxtLink>
  <button
    v-else
    v-bind="$attrs"
    :class="classes"
    :type="type"
    :disabled="disabled"
  >
    <component :is="icon" v-if="icon" :size="18" aria-hidden="true" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import type { Component } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    to?: string;
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    icon?: Component;
  }>(),
  {
    variant: "primary",
    size: "md",
    type: "button",
    disabled: false,
    to: undefined,
    icon: undefined,
  },
);

const classes = computed(() => [
  "ui-button",
  `ui-button--${props.variant}`,
  `ui-button--${props.size}`,
  { "is-disabled": props.disabled },
]);
</script>

<style scoped>
.ui-button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 0 18px;
  font-weight: 800;
  letter-spacing: 0;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.ui-button:hover {
  transform: translateY(-1px);
}

.ui-button--primary {
  background: var(--color-primary);
  color: #fff;
  box-shadow: var(--shadow-sm);
}

.ui-button--secondary {
  background: var(--color-accent);
  color: var(--color-primary);
}

.ui-button--ghost {
  background: #fff;
  color: var(--color-primary);
  border-color: var(--color-line);
}

.ui-button--danger {
  background: var(--color-warning);
  color: #fff;
}

.ui-button--sm {
  min-height: 34px;
  padding: 0 12px;
  font-size: 13px;
}

.ui-button--lg {
  min-height: 50px;
  padding: 0 24px;
}

.ui-button:disabled,
.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
}
</style>
