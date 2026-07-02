<template>
  <ClientOnly>
    <div class="toast-editor">
      <div ref="editorEl" />
      <p v-if="uploading" class="uploading">이미지를 업로드하는 중입니다.</p>
    </div>
    <template #fallback>
      <Textarea
        :model-value="modelValue"
        rows="12"
        @update:model-value="$emit('update:modelValue', $event)"
      />
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";

type ToastEditorInstance = {
  getMarkdown: () => string;
  setMarkdown: (value: string, cursorToEnd?: boolean) => void;
  destroy: () => void;
};

const props = withDefaults(
  defineProps<{
    modelValue: string;
    pathPrefix?: string;
    height?: string;
  }>(),
  {
    pathPrefix: "editor",
    height: "520px",
  },
);
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const editorEl = ref<HTMLElement | null>(null);
const editor = shallowRef<ToastEditorInstance | null>(null);
const uploading = ref(false);
let syncingFromEditor = false;

const uploadImage = async (file: File) => {
  const firebase = useNuxtApp().$firebase;
  if (!firebase.enabled || !firebase.storage) {
    throw new Error("Firebase Storage 설정이 필요합니다.");
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${props.pathPrefix}/${Date.now()}-${safeName}`;
  uploading.value = true;
  try {
    const target = storageRef(firebase.storage, path);
    await uploadBytes(target, file, { contentType: file.type });
    return await getDownloadURL(target);
  } finally {
    uploading.value = false;
  }
};

onMounted(async () => {
  if (!editorEl.value) return;
  const { default: Editor } = await import("@toast-ui/editor");
  editor.value = new Editor({
    el: editorEl.value,
    height: props.height,
    initialEditType: "wysiwyg",
    previewStyle: "vertical",
    initialValue: props.modelValue,
    usageStatistics: false,
    hideModeSwitch: false,
    toolbarItems: [
      ["heading", "bold", "italic", "strike"],
      ["hr", "quote"],
      ["ul", "ol", "task"],
      ["table", "image", "link"],
      ["code", "codeblock"],
      ["scrollSync"],
    ],
    hooks: {
      addImageBlobHook: async (
        blob: Blob | File,
        callback: (url: string, altText?: string) => void,
      ) => {
        const file =
          blob instanceof File
            ? blob
            : new File([blob], `editor-image-${Date.now()}.png`, {
                type: blob.type,
              });
        const url = await uploadImage(file);
        callback(url, file.name);
      },
    },
    events: {
      change: () => {
        if (!editor.value) return;
        syncingFromEditor = true;
        emit("update:modelValue", editor.value.getMarkdown());
        nextTick(() => {
          syncingFromEditor = false;
        });
      },
    },
  }) as ToastEditorInstance;
});

watch(
  () => props.modelValue,
  (value) => {
    if (syncingFromEditor || !editor.value) return;
    if (editor.value.getMarkdown() !== value) editor.value.setMarkdown(value);
  },
);

onBeforeUnmount(() => {
  editor.value?.destroy();
  editor.value = null;
});
</script>

<style scoped>
.toast-editor {
  display: grid;
  gap: 8px;
}

.uploading {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.toast-editor :deep(.toastui-editor-defaultUI) {
  border-color: var(--color-line);
  border-radius: 8px;
  overflow: hidden;
}
</style>
