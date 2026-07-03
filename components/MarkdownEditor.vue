<template>
  <ClientOnly>
    <div class="toast-editor" :class="{ 'is-ready': ready }">
      <div v-if="!ready && !errorMessage" class="editor-state">
        Toast UI Editor를 불러오는 중입니다.
      </div>
      <div v-if="errorMessage" class="editor-error">
        <strong>에디터를 불러오지 못했습니다.</strong>
        <span>{{ errorMessage }}</span>
        <Textarea
          :model-value="modelValue"
          rows="12"
          @update:model-value="$emit('update:modelValue', $event)"
        />
      </div>
      <div v-show="!errorMessage" ref="editorEl" class="editor-mount" />
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
const ready = ref(false);
const uploading = ref(false);
const errorMessage = ref("");
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
  try {
    await nextTick();
    if (!editorEl.value) throw new Error("에디터 영역을 찾을 수 없습니다.");
    const toastEditorModule = await import("@toast-ui/editor");
    const Editor = toastEditorModule.default;
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
          try {
            const file =
              blob instanceof File
                ? blob
                : new File([blob], `editor-image-${Date.now()}.png`, {
                    type: blob.type,
                  });
            const url = await uploadImage(file);
            callback(url, file.name);
          } catch (error) {
            errorMessage.value =
              error instanceof Error
                ? error.message
                : "이미지 업로드 중 문제가 발생했습니다.";
          }
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
    ready.value = true;
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "Toast UI Editor 초기화 중 문제가 발생했습니다.";
  }
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
  position: relative;
  display: grid;
  gap: 8px;
}

.editor-mount {
  min-height: 320px;
}

.editor-state,
.editor-error {
  display: grid;
  min-height: 320px;
  align-content: center;
  gap: 10px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  padding: 18px;
  color: var(--color-muted);
  font-size: 14px;
  font-weight: 800;
}

.editor-error {
  align-content: start;
  color: var(--color-primary);
}

.editor-error span {
  color: var(--color-warning);
  font-size: 13px;
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
