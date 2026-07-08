<template>
  <Teleport to="body">
    <div
      v-if="open && src"
      class="image-lightbox"
      role="dialog"
      aria-modal="true"
      :aria-label="alt || '이미지 크게 보기'"
      @click.self="emit('close')"
    >
      <button
        type="button"
        class="image-lightbox__close"
        title="닫기"
        aria-label="닫기"
        @click="emit('close')"
      >
        <X :size="20" />
      </button>
      <div class="image-lightbox__viewport">
        <img :src="src" :alt="alt" class="image-lightbox__image">
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from "@lucide/vue";

const props = defineProps<{
  open: boolean;
  src: string;
  alt?: string;
}>();
const emit = defineEmits<{ close: [] }>();

let previousBodyOverflow = "";

const closeOnEscape = (event: KeyboardEvent) => {
  if (event.key === "Escape" && props.open) emit("close");
};

watch(
  () => props.open,
  (open) => {
    if (!import.meta.client) return;

    if (open) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return;
    }

    document.body.style.overflow = previousBodyOverflow;
  },
);

onMounted(() => {
  window.addEventListener("keydown", closeOnEscape);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", closeOnEscape);
  if (import.meta.client && props.open)
    document.body.style.overflow = previousBodyOverflow;
});
</script>

<style scoped>
.image-lightbox {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  background: rgba(23, 23, 23, 0.72);
  padding: 5vh 5vw;
}

.image-lightbox__viewport {
  width: 90vw;
  max-height: 90vh;
  max-height: 90dvh;
  overflow: auto;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 18px 54px rgba(0, 0, 0, 0.28);
  overscroll-behavior: contain;
}

.image-lightbox__image {
  display: block;
  width: 100%;
  max-width: none;
  height: auto;
}

.image-lightbox__close {
  position: fixed;
  top: calc(max(16px, 5vh) + 14px);
  right: calc(max(16px, 5vw) + 14px);
  z-index: 1;
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 50%;
  background: rgba(23, 23, 23, 0.86);
  color: #fff;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(8px);
}

.image-lightbox__close:hover {
  background: rgba(23, 23, 23, 0.96);
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .image-lightbox__close {
    top: 24px;
    right: 24px;
  }
}
</style>
