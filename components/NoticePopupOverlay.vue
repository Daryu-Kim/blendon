<template>
  <Teleport to="body">
    <div
      v-if="visiblePopup"
      class="popup-overlay"
      role="dialog"
      aria-modal="true"
    >
      <article class="popup-modal">
        <button
          class="close-button"
          type="button"
          aria-label="닫기"
          @click="close"
        >
          <X :size="20" />
        </button>
        <img
          v-if="visiblePopup.imageUrl"
          class="popup-image"
          :src="visiblePopup.imageUrl"
          :alt="visiblePopup.title"
        />
        <div class="popup-body">
          <h2>{{ visiblePopup.title }}</h2>
          <MarkdownContent
            v-if="visiblePopup.content"
            :content="visiblePopup.content"
          />
        </div>
        <div class="popup-actions">
          <Button
            v-if="visiblePopup.linkUrl"
            :to="visiblePopup.linkUrl"
            variant="secondary"
            @click="close"
          >
            {{ visiblePopup.buttonText }}
          </Button>
          <Button type="button" variant="ghost" @click="dismiss">
            {{ dismissLabel }}
          </Button>
        </div>
      </article>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from "@lucide/vue";
import type { NoticePopup } from "~/types/domain";

const route = useRoute();
const popupStore = useNoticePopupStore();
const visiblePopup = ref<NoticePopup | null>(null);

const storageKey = (popup: NoticePopup) => `notice-popup:${popup.id}`;

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const isDismissed = (popup: NoticePopup) => {
  if (!import.meta.client || popup.dismissMode === "none") return false;
  const key = storageKey(popup);
  if (popup.dismissMode === "session")
    return sessionStorage.getItem(key) === "closed";
  return localStorage.getItem(key) === todayKey();
};

const pickPopup = () => {
  if (!import.meta.client) return;
  const current = popupStore.activePopups.find((popup) => {
    const placementOk = popup.placement === "all" || route.path === "/";
    return placementOk && !isDismissed(popup);
  });
  visiblePopup.value = current || null;
};

const close = () => {
  visiblePopup.value = null;
};

const dismiss = () => {
  if (!visiblePopup.value || !import.meta.client) return close();
  const popup = visiblePopup.value;
  const key = storageKey(popup);
  if (popup.dismissMode === "session") sessionStorage.setItem(key, "closed");
  if (popup.dismissMode === "today") localStorage.setItem(key, todayKey());
  close();
};

const dismissLabel = computed(() => {
  if (!visiblePopup.value) return "닫기";
  if (visiblePopup.value.dismissMode === "today") return "오늘 하루 닫기";
  if (visiblePopup.value.dismissMode === "session") return "이번 접속에서 닫기";
  return "닫기";
});

onMounted(async () => {
  await popupStore.fetchPopups();
  pickPopup();
});

watch(
  () => route.fullPath,
  () => pickPopup(),
);
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  z-index: 200;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(23, 23, 23, 0.42);
  padding: 20px;
  backdrop-filter: blur(6px);
}

.popup-modal {
  position: relative;
  display: grid;
  width: min(520px, 100%);
  max-height: min(760px, calc(100vh - 40px));
  overflow: auto;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 24px 80px rgba(23, 23, 23, 0.22);
}

.close-button {
  position: absolute;
  top: 12px;
  right: 12px;
  display: inline-grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid var(--color-line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  cursor: pointer;
}

.popup-image {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
}

.popup-body {
  display: grid;
  gap: 14px;
  padding: 24px;
}

.popup-body h2 {
  margin: 0;
  font-size: 24px;
  letter-spacing: 0;
}

.popup-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid var(--color-line);
  padding: 14px 18px;
}
</style>
