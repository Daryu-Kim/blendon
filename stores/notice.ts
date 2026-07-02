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
} from "firebase/firestore";
import { defineStore } from "pinia";
import type { Notice } from "~/types/domain";

const timestampToIso = (value: unknown) => {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date().toISOString();
};

const normalizeNotice = (id: string, data: Partial<Notice>): Notice => ({
  id,
  title: data.title || "",
  content: data.content || "",
  isPinned: Boolean(data.isPinned),
  createdAt: timestampToIso(data.createdAt),
  updatedAt: timestampToIso(data.updatedAt),
});

export const useNoticeStore = defineStore("notice", {
  state: () => ({
    notices: [] as Notice[],
    initialized: false,
    loading: false,
  }),
  getters: {
    sortedNotices: (state) =>
      [...state.notices].sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.createdAt.localeCompare(a.createdAt);
      }),
  },
  actions: {
    async fetchNotices(force = false) {
      if (this.initialized && !force) return;
      const firebase = useNuxtApp().$firebase;
      this.loading = true;
      try {
        await useGlobalLoading().withLoading(async () => {
          if (firebase.enabled && firebase.db) {
            const snap = await getDocs(
              query(collection(firebase.db, "notices"), orderBy("createdAt", "desc")),
            );
            this.notices = snap.docs.map((item) =>
              normalizeNotice(item.id, item.data() as Partial<Notice>),
            );
          } else {
            this.notices = [];
          }
          this.initialized = true;
        }, "공지사항을 불러오는 중");
      } finally {
        this.loading = false;
      }
    },
    async fetchNotice(id: string) {
      await this.fetchNotices();
      const cached = this.notices.find((notice) => notice.id === id);
      if (cached) return cached;
      const firebase = useNuxtApp().$firebase;
      if (!firebase.enabled || !firebase.db) return null;
      const snap = await getDoc(doc(firebase.db, "notices", id));
      if (!snap.exists()) return null;
      const notice = normalizeNotice(snap.id, snap.data() as Partial<Notice>);
      this.notices.unshift(notice);
      return notice;
    },
    async upsertNotice(notice: Notice) {
      const now = new Date().toISOString();
      const payload = {
        ...notice,
        updatedAt: now,
        createdAt: notice.createdAt || now,
      };
      const index = this.notices.findIndex((item) => item.id === payload.id);
      if (index >= 0) this.notices[index] = payload;
      else this.notices.unshift(payload);

      const firebase = useNuxtApp().$firebase;
      if (firebase.enabled && firebase.db) {
        await useGlobalLoading().withLoading(async () => {
          await setDoc(
            doc(firebase.db!, "notices", payload.id),
            {
              ...payload,
              updatedAt: serverTimestamp(),
              createdAt: notice.createdAt ? payload.createdAt : serverTimestamp(),
            },
            { merge: true },
          );
        }, "공지사항을 저장하는 중");
      }
    },
    async deleteNotice(id: string) {
      this.notices = this.notices.filter((notice) => notice.id !== id);
      const firebase = useNuxtApp().$firebase;
      if (firebase.enabled && firebase.db) {
        await useGlobalLoading().withLoading(async () => {
          await deleteDoc(doc(firebase.db!, "notices", id));
        }, "공지사항을 삭제하는 중");
      }
    },
  },
});
