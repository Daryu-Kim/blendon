import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { defineStore } from "pinia";
import type { ProductReview, ReviewMedia } from "~/types/domain";

interface CreateReviewInput {
  productId: string;
  productSlug: string;
  productName: string;
  rating: number;
  content: string;
  media: ReviewMedia[];
}

interface ProductReviewSummary {
  averageRating: number;
  reviewCount: number;
}

const emptySummary = (): ProductReviewSummary => ({
  averageRating: 0,
  reviewCount: 0,
});

const summarizeReviews = (reviews: ProductReview[]): ProductReviewSummary => {
  const visibleReviews = reviews.filter((review) => review.isVisible);
  if (!visibleReviews.length) return emptySummary();
  const total = visibleReviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    averageRating: total / visibleReviews.length,
    reviewCount: visibleReviews.length,
  };
};

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

const normalizeMedia = (media: unknown): ReviewMedia[] =>
  Array.isArray(media)
    ? (media
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const record = item as Partial<ReviewMedia>;
          if (!record.url) return null;
          return {
            url: record.url,
            type: record.type === "video" ? "video" : "image",
            name: record.name || "",
          } satisfies ReviewMedia;
        })
        .filter(Boolean) as ReviewMedia[])
    : [];

const normalizeReview = (
  id: string,
  data: Partial<ProductReview>,
): ProductReview => ({
  id,
  productId: data.productId || "",
  productSlug: data.productSlug || "",
  productName: data.productName || "",
  userId: data.userId || "",
  userName: data.userName || "고객",
  rating: Math.min(5, Math.max(1, Number(data.rating || 5))),
  content: data.content || "",
  media: normalizeMedia(data.media),
  adminReply: data.adminReply || "",
  adminReplyAt: data.adminReplyAt || null,
  adminReplyBy: data.adminReplyBy || null,
  isVisible: data.isVisible ?? true,
  createdAt: timestampToIso(data.createdAt),
  updatedAt: timestampToIso(data.updatedAt),
});

export const useProductReviewStore = defineStore("productReview", {
  state: () => ({
    reviews: [] as ProductReview[],
    byProduct: {} as Record<string, ProductReview[]>,
    summaries: {} as Record<string, ProductReviewSummary>,
    initialized: false,
    loading: false,
  }),
  getters: {
    productReviews: (state) => (productId: string) =>
      state.byProduct[productId] || [],
    productSummary: (state) => (productId: string) => {
      const reviews = state.byProduct[productId];
      if (reviews) return summarizeReviews(reviews);
      return state.summaries[productId] || emptySummary();
    },
  },
  actions: {
    setSummary(productId: string, reviews: ProductReview[]) {
      this.summaries[productId] = summarizeReviews(reviews);
    },
    syncReview(review: ProductReview) {
      const index = this.reviews.findIndex((item) => item.id === review.id);
      if (index >= 0) this.reviews[index] = review;
      else this.reviews.unshift(review);

      const current = this.byProduct[review.productId] || [];
      const productIndex = current.findIndex((item) => item.id === review.id);
      const next = [...current];
      if (productIndex >= 0) next[productIndex] = review;
      else next.unshift(review);
      this.byProduct[review.productId] = next.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      this.setSummary(review.productId, this.byProduct[review.productId]);
    },
    async fetchReviewSummaries(productIds: string[], force = false) {
      const ids = [...new Set(productIds.filter(Boolean))];
      const missingIds = force
        ? ids
        : ids.filter((productId) => !this.summaries[productId]);
      if (!missingIds.length) return;

      const firebase = useNuxtApp().$firebase;
      if (!firebase.enabled || !firebase.db) {
        missingIds.forEach((productId) => {
          this.summaries[productId] = emptySummary();
        });
        return;
      }

      const chunks = Array.from(
        { length: Math.ceil(missingIds.length / 30) },
        (_, index) => missingIds.slice(index * 30, index * 30 + 30),
      );

      try {
        await Promise.all(
          chunks.map(async (chunk) => {
            const snap = await getDocs(
              query(
                collection(firebase.db!, "productReviews"),
                where("productId", "in", chunk),
                where("isVisible", "==", true),
              ),
            );
            const grouped = chunk.reduce<Record<string, ProductReview[]>>(
              (result, productId) => {
                result[productId] = [];
                return result;
              },
              {},
            );
            snap.docs.forEach((item) => {
              const review = normalizeReview(
                item.id,
                item.data() as Partial<ProductReview>,
              );
              grouped[review.productId]?.push(review);
            });
            Object.entries(grouped).forEach(([productId, reviews]) => {
              this.setSummary(productId, reviews);
            });
          }),
        );
      } catch (error) {
        console.error("Failed to load product review summaries.", error);
        missingIds.forEach((productId) => {
          this.summaries[productId] ||= emptySummary();
        });
      }
    },
    async fetchProductReviews(productId: string, force = false) {
      if (!productId || (this.byProduct[productId] && !force)) return;
      const firebase = useNuxtApp().$firebase;
      const auth = useAuthStore();
      this.loading = true;
      try {
        await useGlobalLoading().withLoading(async () => {
          if (!firebase.enabled || !firebase.db) {
            this.byProduct[productId] = [];
            this.setSummary(productId, []);
            return;
          }
          await auth.init();
          const constraints = auth.isAdmin
            ? [
                where("productId", "==", productId),
                orderBy("createdAt", "desc"),
              ]
            : [
                where("productId", "==", productId),
                where("isVisible", "==", true),
                orderBy("createdAt", "desc"),
              ];
          const snap = await getDocs(
            query(collection(firebase.db, "productReviews"), ...constraints),
          );
          this.byProduct[productId] = snap.docs.map((item) =>
            normalizeReview(item.id, item.data() as Partial<ProductReview>),
          );
          this.setSummary(productId, this.byProduct[productId]);
        }, "리뷰를 불러오는 중");
      } finally {
        this.loading = false;
      }
    },
    async fetchReviews(force = false) {
      if (this.initialized && !force) return;
      const firebase = useNuxtApp().$firebase;
      const auth = useAuthStore();
      this.loading = true;
      try {
        await useGlobalLoading().withLoading(async () => {
          if (!firebase.enabled || !firebase.db) {
            this.reviews = [];
            this.initialized = true;
            return;
          }
          await auth.init();
          if (!auth.isAdmin) {
            this.reviews = [];
            this.initialized = true;
            return;
          }
          const snap = await getDocs(
            query(
              collection(firebase.db, "productReviews"),
              orderBy("updatedAt", "desc"),
            ),
          );
          this.reviews = snap.docs.map((item) =>
            normalizeReview(item.id, item.data() as Partial<ProductReview>),
          );
          this.reviews.forEach((review) => this.syncReview(review));
          this.initialized = true;
        }, "리뷰 목록을 불러오는 중");
      } finally {
        this.loading = false;
      }
    },
    async fetchPublicReviews(force = false) {
      if (this.initialized && this.reviews.length && !force) return;
      const firebase = useNuxtApp().$firebase;
      this.loading = true;
      try {
        await useGlobalLoading().withLoading(async () => {
          if (!firebase.enabled || !firebase.db) {
            this.reviews = [];
            this.initialized = true;
            return;
          }
          const snap = await getDocs(
            query(
              collection(firebase.db, "productReviews"),
              where("isVisible", "==", true),
            ),
          );
          const reviews = snap.docs
            .map((item) =>
              normalizeReview(item.id, item.data() as Partial<ProductReview>),
            )
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );
          this.reviews = reviews;
          this.byProduct = {};
          reviews.forEach((review) => this.syncReview(review));
          this.initialized = true;
        }, "구매후기를 불러오는 중");
      } finally {
        this.loading = false;
      }
    },
    async createReview(input: CreateReviewInput) {
      const auth = useAuthStore();
      await auth.init();
      if (!auth.profile)
        throw new Error("로그인 후 리뷰를 작성할 수 있습니다.");

      const firebase = useNuxtApp().$firebase;
      if (!firebase.enabled || !firebase.db)
        throw new Error("Firebase Firestore 설정이 필요합니다.");

      const now = new Date().toISOString();
      const id = `review-${input.productId}-${auth.profile.uid}-${Date.now()}`;
      const review = normalizeReview(id, {
        ...input,
        id,
        userId: auth.profile.uid,
        userName: auth.profile.displayName || auth.profile.loginId || "고객",
        rating: Math.round(input.rating),
        content: input.content.trim(),
        media: input.media,
        adminReply: "",
        adminReplyAt: null,
        adminReplyBy: null,
        isVisible: true,
        createdAt: now,
        updatedAt: now,
      });

      await useGlobalLoading().withLoading(async () => {
        await setDoc(doc(firebase.db!, "productReviews", id), {
          ...review,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }, "리뷰를 저장하는 중");
      this.syncReview(review);
      return review;
    },
    async updateReview(id: string, updates: Partial<ProductReview>) {
      const current =
        this.reviews.find((review) => review.id === id) ||
        Object.values(this.byProduct)
          .flat()
          .find((review) => review.id === id);
      if (!current) return;

      const next = normalizeReview(id, {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      this.syncReview(next);

      const firebase = useNuxtApp().$firebase;
      if (!firebase.enabled || !firebase.db) return;
      await useGlobalLoading().withLoading(async () => {
        await updateDoc(doc(firebase.db!, "productReviews", id), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      }, "리뷰를 저장하는 중");
    },
    async saveAdminReply(id: string, reply: string) {
      const auth = useAuthStore();
      await auth.init();
      await this.updateReview(id, {
        adminReply: reply.trim(),
        adminReplyAt: reply.trim() ? new Date().toISOString() : null,
        adminReplyBy: reply.trim() ? auth.profile?.uid || null : null,
      });
    },
    async setVisibility(id: string, isVisible: boolean) {
      await this.updateReview(id, { isVisible });
    },
  },
});
