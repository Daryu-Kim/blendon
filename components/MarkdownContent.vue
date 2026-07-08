<template>
  <ClientOnly>
    <div
      v-if="hasContent"
      class="markdown-viewer"
      @click="openImagePreview"
    >
      <MdPreview
        :id="previewId"
        :model-value="viewerContent"
        editor-id="customer-content-viewer"
        theme="light"
        preview-theme="github"
        code-theme="github"
        class="markdown-content"
        no-img-zoom-in
      />
    </div>
    <p v-else class="markdown-content empty">등록된 본문이 없습니다.</p>
    <template #fallback>
      <div class="markdown-content fallback">
        {{ content }}
      </div>
    </template>
  </ClientOnly>
  <ImageLightbox
    :open="Boolean(previewImage.src)"
    :src="previewImage.src"
    :alt="previewImage.alt"
    @close="closeImagePreview"
  />
</template>

<script setup lang="ts">
import { MdPreview } from "md-editor-v3";

const props = defineProps<{ content: string }>();

const previewId = `md-preview-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
const hasContent = computed(() => props.content.trim().length > 0);
const viewerContent = computed(() => preserveMarkdownBlankLines(props.content));
const previewImage = reactive({
  src: "",
  alt: "",
});

const openImagePreview = (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof HTMLImageElement) || !target.currentSrc) return;

  event.preventDefault();
  previewImage.src = target.currentSrc;
  previewImage.alt = target.alt || "상세 이미지";
};

const closeImagePreview = () => {
  previewImage.src = "";
  previewImage.alt = "";
};
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

.empty {
  margin: 0;
  color: var(--color-muted);
  font-weight: 700;
}

.markdown-content :deep(.md-editor-preview-wrapper) {
  padding: 0;
  background: transparent;
}

.markdown-content :deep(.md-editor-preview) {
  color: var(--color-primary);
  font-family: inherit;
  font-size: 15px;
}

.markdown-content :deep(.md-editor-preview p) {
  margin: 0 0 1em;
}

.markdown-content :deep(.md-editor-preview img) {
  max-width: 100%;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  cursor: zoom-in;
}

.markdown-content :deep(.md-editor-preview a) {
  color: #8d6b28;
  font-weight: 800;
}
</style>
