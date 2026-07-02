import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { defineStore } from "pinia";
import type { NoticePopup } from "~/types/domain";

const timestampToIsoOrNull = (value: unknown) => {
  if (!value) return null;
  if (
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return typeof value === "string" ? value : null;
};

const timestampToIso = (value: unknown) =>
  timestampToIsoOrNull(value) || new Date().toISOString();

const normalizePopup = (
  id: string,
  data: Partial<NoticePopup>,
): NoticePopup => ({
  id,
  title: data.title || "",
  content: data.content || "",
  imageUrl: data.imageUrl || "",
  linkUrl: data.linkUrl || "",
  buttonText: data.buttonText || "자세히 보기",
  placement: data.placement || "main",
  isActive: data.isActive ?? true,
  dismissMode: data.dismissMode || "today",
  startsAt: timestampToIsoOrNull(data.startsAt),
  endsAt: timestampToIsoOrNull(data.endsAt),
  order: Number(data.order || 0),
  createdAt: timestampToIso(data.createdAt),
  updatedAt: timestampToIso(data.updatedAt),
});

const isInSchedule = (popup: NoticePopup) => {
  const now = Date.now();
  const startsAt = popup.startsAt ? new Date(popup.startsAt).getTime() : null;
  const endsAt = popup.endsAt ? new Date(popup.endsAt).getTime() : null;
  return (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);
};

export const useNoticePopupStore = defineStore("noticePopup", {
  state: () => ({
    popups: [] as NoticePopup[],
    initialized: false,
    loading: false,
  }),
  getters: {
    activePopups: (state) =>
      state.popups
        .filter((popup) => popup.isActive && isInSchedule(popup))
        .sort((a, b) => a.order - b.order),
  },
  actions: {
    async fetchPopups(force = false) {
      if (this.initialized && !force) return;
      const firebase = useNuxtApp().$firebase;
      const auth = useAuthStore();
      this.loading = true;
      try {
        await useGlobalLoading().withLoading(async () => {
          if (!firebase.enabled || !firebase.db) {
            this.popups = [];
            this.initialized = true;
            return;
          }
          await auth.init();
          const popupQuery = query(
            collection(firebase.db, "noticePopups"),
            ...(auth.isAdmin ? [] : [where("isActive", "==", true)]),
            orderBy("order", "asc"),
          );
          const snap = await getDocs(popupQuery);
          this.popups = snap.docs.map((item) =>
            normalizePopup(item.id, item.data() as Partial<NoticePopup>),
          );
          this.initialized = true;
        }, "공지 팝업을 불러오는 중");
      } finally {
        this.loading = false;
      }
    },
    async fetchPopup(id: string) {
      await this.fetchPopups();
      const cached = this.popups.find((popup) => popup.id === id);
      if (cached) return cached;
      const firebase = useNuxtApp().$firebase;
      if (!firebase.enabled || !firebase.db) return null;
      const snap = await getDoc(doc(firebase.db, "noticePopups", id));
      if (!snap.exists()) return null;
      const popup = normalizePopup(
        snap.id,
        snap.data() as Partial<NoticePopup>,
      );
      this.popups.unshift(popup);
      return popup;
    },
    findById(id: string) {
      return this.popups.find((popup) => popup.id === id);
    },
    async upsertPopup(popup: NoticePopup) {
      const now = new Date().toISOString();
      const payload = normalizePopup(popup.id, {
        ...popup,
        createdAt: popup.createdAt || now,
        updatedAt: now,
      });
      const index = this.popups.findIndex((item) => item.id === payload.id);
      if (index >= 0) this.popups[index] = payload;
      else this.popups.unshift(payload);

      const firebase = useNuxtApp().$firebase;
      if (!firebase.enabled || !firebase.db) return;
      await useGlobalLoading().withLoading(async () => {
        await setDoc(
          doc(firebase.db!, "noticePopups", payload.id),
          {
            ...payload,
            createdAt: popup.createdAt ? payload.createdAt : serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }, "공지 팝업을 저장하는 중");
    },
    async deletePopup(id: string) {
      this.popups = this.popups.filter((popup) => popup.id !== id);
      const firebase = useNuxtApp().$firebase;
      if (!firebase.enabled || !firebase.db) return;
      await useGlobalLoading().withLoading(async () => {
        await deleteDoc(doc(firebase.db!, "noticePopups", id));
      }, "공지 팝업을 삭제하는 중");
    },
  },
});
