<template>
  <div class="review-media-uploader">
    <div v-if="modelValue.length" class="media-grid">
      <div v-for="item in modelValue" :key="item.url" class="media-item">
        <img v-if="item.type === 'image'" :src="item.url" :alt="item.name">
        <video v-else :src="item.url" controls muted />
        <button type="button" aria-label="미디어 삭제" @click="remove(item.url)">
          삭제
        </button>
      </div>
    </div>

    <label class="upload-button">
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        :disabled="uploading || modelValue.length >= max"
        @change="uploadFiles"
      >
      사진/동영상 추가
    </label>
    <p>{{ helperText }}</p>
  </div>
</template>

<script setup lang="ts">
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import type { ReviewMedia } from "~/types/domain";

const props = withDefaults(
  defineProps<{
    modelValue: ReviewMedia[];
    pathPrefix: string;
    max?: number;
  }>(),
  { max: 5 },
);
const emit = defineEmits<{ "update:modelValue": [value: ReviewMedia[]] }>();

const uploading = ref(false);
const helperText = computed(() =>
  uploading.value
    ? "미디어를 업로드하는 중입니다."
    : `최대 ${props.max}개까지 사진 또는 동영상을 첨부할 수 있습니다.`,
);

const mediaType = (file: File): ReviewMedia["type"] =>
  file.type.startsWith("video/") ? "video" : "image";

const remove = (url: string) => {
  emit(
    "update:modelValue",
    props.modelValue.filter((item) => item.url !== url),
  );
};

const uploadFiles = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []).slice(
    0,
    Math.max(0, props.max - props.modelValue.length),
  );
  if (!files.length) return;

  const firebase = useNuxtApp().$firebase;
  if (!firebase.enabled || !firebase.storage)
    throw new Error("Firebase Storage 설정이 필요합니다.");

  uploading.value = true;
  try {
    await useGlobalLoading().withLoading(async () => {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
          const path = `${props.pathPrefix}/${Date.now()}-${safeName}`;
          const target = storageRef(firebase.storage!, path);
          await uploadBytes(target, file, { contentType: file.type });
          return {
            url: await getDownloadURL(target),
            type: mediaType(file),
            name: file.name,
          } satisfies ReviewMedia;
        }),
      );
      emit("update:modelValue", [...props.modelValue, ...uploaded]);
    }, "리뷰 미디어를 업로드하는 중");
    input.value = "";
  } finally {
    uploading.value = false;
  }
};
</script>

<style scoped>
.review-media-uploader {
  display: grid;
  gap: 10px;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.media-item {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
}

.media-item img,
.media-item video {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.media-item button {
  position: absolute;
  right: 6px;
  bottom: 6px;
  border: 0;
  border-radius: 999px;
  background: rgba(23, 23, 23, 0.74);
  color: #fff;
  padding: 5px 8px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.upload-button {
  display: inline-flex;
  width: fit-content;
  min-height: 38px;
  align-items: center;
  border: 1px solid var(--color-line);
  border-radius: 999px;
  background: #fff;
  padding: 0 14px;
  font-weight: 900;
  cursor: pointer;
}

.upload-button input {
  display: none;
}

p {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
}

@media (min-width: 760px) {
  .media-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>
