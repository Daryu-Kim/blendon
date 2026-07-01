<template>
  <div class="image-uploader">
    <div class="preview">
      <img v-if="modelValue" :src="modelValue" alt="업로드 미리보기" />
      <Image v-else :size="32" aria-hidden="true" />
    </div>
    <input
      type="file"
      accept="image/*"
      :disabled="uploading"
      @change="uploadFile"
    />
    <Input
      :model-value="modelValue"
      placeholder="이미지 URL 또는 Storage 경로"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <p>{{ helperText }}</p>
  </div>
</template>

<script setup lang="ts">
import { Image } from "@lucide/vue";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";

const props = withDefaults(
  defineProps<{ modelValue: string; pathPrefix?: string }>(),
  {
    pathPrefix: "uploads",
  },
);
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const uploading = ref(false);
const helperText = computed(() =>
  uploading.value
    ? "이미지를 업로드하는 중입니다."
    : "파일 업로드 또는 URL 직접 입력을 사용할 수 있습니다.",
);

const uploadFile = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const firebase = useNuxtApp().$firebase;
  if (!firebase.enabled || !firebase.storage) {
    throw new Error("Firebase Storage 설정이 필요합니다.");
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${props.pathPrefix}/${Date.now()}-${safeName}`;
  uploading.value = true;
  try {
    await useGlobalLoading().withLoading(async () => {
      const target = storageRef(firebase.storage!, path);
      await uploadBytes(target, file, { contentType: file.type });
      emit("update:modelValue", await getDownloadURL(target));
    }, "이미지를 업로드하는 중");
    input.value = "";
  } finally {
    uploading.value = false;
  }
};
</script>

<style scoped>
.image-uploader {
  display: grid;
  gap: 10px;
}

.preview {
  display: grid;
  width: 140px;
  aspect-ratio: 1;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
}

.preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

p {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
}
</style>
