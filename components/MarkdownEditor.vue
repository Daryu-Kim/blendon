<template>
  <ClientOnly>
    <div class="md-editor-wrap">
      <MdEditor
        :id="editorId"
        :editor-id="editorId"
        :model-value="modelValue"
        :height="height"
        language="en-US"
        theme="light"
        preview-theme="github"
        code-theme="github"
        :preview="true"
        :html-preview="false"
        :toolbars="toolbars"
        :on-upload-img="handleUploadImages"
        @update:model-value="$emit('update:modelValue', $event)"
      />
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
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { MdEditor, allToolbar } from "md-editor-v3";
import type {
  ToolbarNames,
  UploadImgCallBack,
  UploadImgEvent,
} from "md-editor-v3";

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
defineEmits<{ "update:modelValue": [value: string] }>();

const uploading = ref(false);
const editorId = `md-editor-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
const toolbars = allToolbar as ToolbarNames[];

const uploadImage = async (file: File) => {
  const firebase = useNuxtApp().$firebase;
  if (!firebase.enabled || !firebase.storage) {
    throw new Error("Firebase Storage 설정이 필요합니다.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${props.pathPrefix}/${Date.now()}-${safeName}`;
  const target = storageRef(firebase.storage, path);
  await uploadBytes(target, file, { contentType: file.type });

  return await getDownloadURL(target);
};

const handleUploadImages: UploadImgEvent = async (
  files: File[],
  callback: UploadImgCallBack,
) => {
  uploading.value = true;

  try {
    const uploaded = await Promise.all(
      files.map(async (file) => ({
        url: await uploadImage(file),
        alt: file.name,
        title: file.name,
      })),
    );
    callback(uploaded);
  } catch (error) {
    useToast().show(
      error instanceof Error
        ? error.message
        : "이미지 업로드 중 문제가 발생했습니다.",
      "error",
    );
  } finally {
    uploading.value = false;
  }
};
</script>

<style scoped>
.md-editor-wrap {
  position: relative;
  display: grid;
  gap: 8px;
}

.md-editor-wrap :deep(.md-editor) {
  border-color: var(--color-line);
  border-radius: 8px;
  overflow: hidden;
}

.md-editor-wrap :deep(.md-editor-toolbar) {
  background: #fff;
}

.md-editor-wrap :deep(.md-editor-preview-wrapper) {
  background: #fff;
}

.uploading {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}
</style>
