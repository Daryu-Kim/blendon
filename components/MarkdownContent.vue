<template>
  <ClientOnly>
    <div ref="viewerEl" class="markdown-content" />
    <template #fallback>
      <div class="markdown-content fallback">
        {{ content }}
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
type ToastViewerInstance = {
  setMarkdown: (value: string) => void;
  destroy: () => void;
};

const props = defineProps<{ content: string }>();
const viewerEl = ref<HTMLElement | null>(null);
const viewer = shallowRef<ToastViewerInstance | null>(null);

onMounted(async () => {
  if (!viewerEl.value) return;
  const { default: Viewer } = await import("@toast-ui/editor/dist/toastui-editor-viewer");
  viewer.value = new Viewer({
    el: viewerEl.value,
    initialValue: props.content,
    usageStatistics: false,
  }) as ToastViewerInstance;
});

watch(
  () => props.content,
  (value) => {
    viewer.value?.setMarkdown(value);
  },
);

onBeforeUnmount(() => {
  viewer.value?.destroy();
  viewer.value = null;
});
</script>

<style scoped>
.markdown-content {
  color: var(--color-primary);
  line-height: 1.75;
  word-break: keep-all;
}

.fallback {
  white-space: pre-wrap;
}

.markdown-content :deep(.toastui-editor-contents) {
  color: var(--color-primary);
  font-family: inherit;
  font-size: 15px;
}

.markdown-content :deep(.toastui-editor-contents img) {
  max-width: 100%;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
}

.markdown-content :deep(.toastui-editor-contents a) {
  color: #8d6b28;
  font-weight: 800;
}
</style>
