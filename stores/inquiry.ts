import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { defineStore } from "pinia";
import type { Inquiry, InquiryStatus } from "~/types/domain";

const timestampToIso = (value: unknown) => {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date().toISOString();
};

const normalizeInquiry = (id: string, data: Partial<Inquiry>): Inquiry => ({
  id,
  userId: data.userId || "",
  userName: data.userName || "",
  userEmail: data.userEmail || "",
  title: data.title || "",
  content: data.content || "",
  status: data.status || "waiting",
  answer: data.answer || null,
  createdAt: timestampToIso(data.createdAt),
  updatedAt: timestampToIso(data.updatedAt),
  answeredAt: data.answeredAt || null,
});

export const useInquiryStore = defineStore("inquiry", {
  state: () => ({
    inquiries: [] as Inquiry[],
    loading: false,
    initialized: false,
  }),
  actions: {
    async fetchInquiries(force = false) {
      if (this.initialized && !force) return;
      const firebase = useNuxtApp().$firebase;
      const auth = useAuthStore();
      this.loading = true;
      try {
        await useGlobalLoading().withLoading(async () => {
          if (!firebase.enabled || !firebase.db) {
            this.inquiries = [];
            this.initialized = true;
            return;
          }
          await auth.init();
          const constraints = auth.isAdmin
            ? [orderBy("createdAt", "desc")]
            : [
                where("userId", "==", auth.profile?.uid || ""),
                orderBy("createdAt", "desc"),
              ];
          const snap = await getDocs(
            query(collection(firebase.db, "inquiries"), ...constraints),
          );
          this.inquiries = snap.docs.map((item) =>
            normalizeInquiry(item.id, item.data() as Partial<Inquiry>),
          );
          this.initialized = true;
        }, "문의를 불러오는 중");
      } finally {
        this.loading = false;
      }
    },
    async createInquiry(input: Pick<Inquiry, "title" | "content">) {
      const firebase = useNuxtApp().$firebase;
      const auth = useAuthStore();
      await auth.init();
      if (!auth.profile) throw new Error("로그인 후 문의를 남길 수 있습니다.");
      if (!firebase.enabled || !firebase.db)
        throw new Error("Firebase 설정이 필요합니다.");

      const now = new Date().toISOString();
      const payload = {
        userId: auth.profile.uid,
        userName: auth.profile.displayName,
        userEmail: auth.profile.email,
        title: input.title.trim(),
        content: input.content.trim(),
        status: "waiting" as InquiryStatus,
        answer: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        answeredAt: null,
      };
      const ref = await useGlobalLoading().withLoading(
        () => addDoc(collection(firebase.db!, "inquiries"), payload),
        "문의를 접수하는 중",
      );
      const inquiry = normalizeInquiry(ref.id, { ...payload, createdAt: now, updatedAt: now });
      this.inquiries.unshift(inquiry);
      return inquiry;
    },
    async updateInquiry(
      id: string,
      updates: Partial<Pick<Inquiry, "status" | "answer" | "answeredAt">>,
    ) {
      const firebase = useNuxtApp().$firebase;
      if (!firebase.enabled || !firebase.db)
        throw new Error("Firebase 설정이 필요합니다.");
      const now = new Date().toISOString();
      const payload = {
        ...updates,
        updatedAt: serverTimestamp(),
        ...(updates.answer ? { answeredAt: updates.answeredAt || now } : {}),
      };
      await useGlobalLoading().withLoading(
        () => updateDoc(doc(firebase.db!, "inquiries", id), payload),
        "문의를 저장하는 중",
      );
      const target = this.inquiries.find((item) => item.id === id);
      if (target) Object.assign(target, updates, { updatedAt: now });
    },
  },
});
