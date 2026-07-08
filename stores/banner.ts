import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { defineStore } from "pinia";
import type { Banner } from "~/types/domain";

const normalizeBanner = (id: string, data: Partial<Banner>): Banner => ({
  id,
  slug: data.slug || id,
  title: data.title || "",
  subtitle: data.subtitle || "",
  imageUrl: data.imageUrl || "",
  buttonText: data.buttonText || "바로가기",
  linkUrl: data.linkUrl || "",
  productId: data.productId || "",
  isActive: data.isActive ?? true,
  order: Number(data.order || 0),
  placement: data.placement || "home-main",
});

export const useBannerStore = defineStore("banner", {
  state: () => ({
    banners: [] as Banner[],
    initialized: false,
    loading: false,
  }),
  getters: {
    activeHomeMainBanners: (state) =>
      state.banners
        .filter((banner) => banner.isActive && banner.placement === "home-main")
        .sort((a, b) => a.order - b.order),
  },
  actions: {
    async fetchBanners(force = false) {
      if (this.initialized && !force) return;
      const firebase = useNuxtApp().$firebase;
      const auth = useAuthStore();
      this.loading = true;
      try {
        await useGlobalLoading().withLoading(async () => {
          if (!firebase.enabled || !firebase.db) {
            this.banners = [];
            this.initialized = true;
            return;
          }
          await auth.init();
          const snap = await getDocs(
            query(
              collection(firebase.db, "banners"),
              ...(auth.isAdmin ? [] : [where("isActive", "==", true)]),
              orderBy("order", "asc"),
            ),
          );
          this.banners = snap.docs.map((item) =>
            normalizeBanner(item.id, item.data() as Partial<Banner>),
          );
          this.initialized = true;
        }, "배너 정보를 불러오는 중");
      } finally {
        this.loading = false;
      }
    },
    async upsertBanner(banner: Banner) {
      const payload = normalizeBanner(banner.id, banner);
      const index = this.banners.findIndex((item) => item.id === payload.id);
      if (index >= 0) this.banners[index] = payload;
      else this.banners.unshift(payload);
      const firebase = useNuxtApp().$firebase;
      if (!firebase.enabled || !firebase.db) return;
      await useGlobalLoading().withLoading(async () => {
        await setDoc(doc(firebase.db!, "banners", payload.id), payload, {
          merge: true,
        });
      }, "배너를 저장하는 중");
    },
    findById(id: string) {
      return this.banners.find((banner) => banner.id === id);
    },
    async deleteBanner(id: string) {
      this.banners = this.banners.filter((banner) => banner.id !== id);
      const firebase = useNuxtApp().$firebase;
      if (!firebase.enabled || !firebase.db) return;
      await useGlobalLoading().withLoading(async () => {
        await deleteDoc(doc(firebase.db!, "banners", id));
      }, "배너를 삭제하는 중");
    },
  },
});
