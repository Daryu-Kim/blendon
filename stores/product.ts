import {
  collection,
  deleteDoc,
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
import {
  canViewCategory,
  canViewProductWithCategories,
  categoryDisplayGrade,
  gradeLevel,
  PUBLIC_ACCESS_GRADE,
} from "~/utils/access";
import { gradeBenefitSeed } from "~/config/catalog";
import type {
  Category,
  DeviceType,
  GradeBenefit,
  GradeCode,
  NicotineType,
  Product,
} from "~/types/domain";

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

const normalizeDeviceType = (value: unknown): DeviceType => {
  if (
    value === "mtl" ||
    value === "dtl" ||
    value === "disposable" ||
    value === "common"
  )
    return value;
  if (value === "starter" || value === "compact" || value === "all-in-one")
    return "mtl";
  if (value === "high-power") return "dtl";
  if (value === "replaceable" || value === "consumable" || value === "none")
    return "common";
  return "not_applicable";
};

const normalizeNicotineType = (value: unknown): NicotineType => {
  if (
    value === "none" ||
    value === "alternative" ||
    value === "synthetic" ||
    value === "not_applicable"
  )
    return value;
  if (value === "nicotine-free") return "none";
  if (value === "alternative-nicotine") return "alternative";
  return "not_applicable";
};

const normalizeProduct = (id: string, data: Partial<Product>): Product => ({
  id,
  name: data.name || "",
  slug: data.slug || id,
  shortDescription: data.shortDescription || "",
  description: data.description || "",
  categoryIds: data.categoryIds || [],
  brandName: data.brandName || "",
  thumbnailUrl: data.thumbnailUrl || "",
  imageUrls: data.imageUrls || [],
  basePrice: Number(data.basePrice || 0),
  memberPrice: Number(data.memberPrice || data.basePrice || 0),
  compareAtPrice: data.compareAtPrice ?? null,
  gradePrices: data.gradePrices || {},
  isGradeDiscountExcluded: Boolean(data.isGradeDiscountExcluded),
  discountExcludedReason: data.discountExcludedReason || "",
  stock: Number(data.stock || 0),
  options: data.options || [],
  badges: data.badges || [],
  tags: data.tags || [],
  flavorProfile: data.flavorProfile || {
    sweetness: 0,
    coolness: 0,
    body: 0,
    mood: [],
    notes: [],
  },
  deviceType: normalizeDeviceType(data.deviceType),
  nicotineType: normalizeNicotineType(data.nicotineType),
  isNicotineFree: Boolean(data.isNicotineFree),
  isAlternativeNicotine: Boolean(data.isAlternativeNicotine),
  isAdultOnly: Boolean(data.isAdultOnly),
  isVisible: data.isVisible ?? true,
  minUserGradeToView: data.minUserGradeToView || PUBLIC_ACCESS_GRADE,
  minUserGradeLevel: Number(data.minUserGradeLevel || 0),
  displayMinUserGradeToView:
    data.displayMinUserGradeToView || PUBLIC_ACCESS_GRADE,
  minUserGradeToBuy: data.minUserGradeToBuy || PUBLIC_ACCESS_GRADE,
  minUserGradeToBuyLevel: Number(data.minUserGradeToBuyLevel || 0),
  isPriceHiddenBeforeLogin: data.isPriceHiddenBeforeLogin ?? true,
  isPriceHiddenBeforeAdultVerification:
    data.isPriceHiddenBeforeAdultVerification ?? Boolean(data.isAdultOnly),
  status: data.status || "draft",
  detailImageUrls: data.detailImageUrls || [],
  viewRoles: data.viewRoles || [],
  buyRoles: data.buyRoles || [],
  seoTitle: data.seoTitle || "",
  seoDescription: data.seoDescription || "",
  seoKeywords: data.seoKeywords || [],
  ogImageUrl: data.ogImageUrl || "",
  canonicalUrl: data.canonicalUrl || "",
  adminMemo: data.adminMemo || "",
  createdAt: timestampToIso(data.createdAt),
  updatedAt: timestampToIso(data.updatedAt),
});

const fallbackGrades: GradeBenefit[] = gradeBenefitSeed.map((grade) => ({
  ...grade,
}));

const normalizeGradeBenefit = (id: string, data: Partial<GradeBenefit>) =>
  ({
    id,
    gradeCode: data.gradeCode || id,
    internalCode: data.internalCode || "",
    level: Number(data.level || 1),
    label: data.label || data.gradeCode || id,
    discountRate: Number(data.discountRate || 0),
    pointRate: Number(data.pointRate || 0),
    minPurchaseAmount: Number(data.minPurchaseAmount || 0),
    freeShippingThreshold: Number(data.freeShippingThreshold || 0),
    isVisible: data.isVisible ?? true,
    order: Number(data.order || 0),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  }) satisfies GradeBenefit;

const normalizeCategory = (
  id: string,
  data: Partial<Category>,
  gradeBenefits: GradeBenefit[] = [],
): Category => ({
  id,
  name: data.name || "",
  slug: data.slug || id,
  parentId: data.parentId ?? null,
  depth: Number(data.depth || 1),
  order: Number(data.order || 0),
  isVisible: data.isVisible ?? true,
  minUserGradeToView: data.minUserGradeToView || PUBLIC_ACCESS_GRADE,
  minUserGradeLevel:
    Number(data.minUserGradeLevel || 0) ||
    gradeLevel(data.minUserGradeToView || PUBLIC_ACCESS_GRADE, gradeBenefits),
  displayMinUserGradeToView:
    data.displayMinUserGradeToView || PUBLIC_ACCESS_GRADE,
  displayMinUserGradeLevel:
    Number(data.displayMinUserGradeLevel || 0) ||
    gradeLevel(
      data.displayMinUserGradeToView || PUBLIC_ACCESS_GRADE,
      gradeBenefits,
    ),
  adultOnly: Boolean(data.adultOnly),
});

const allowedGradesFor = (
  grade?: GradeCode | null,
  gradeBenefits: GradeBenefit[] = [],
) => {
  if (!grade) return [PUBLIC_ACCESS_GRADE];
  const grades = (gradeBenefits.length ? gradeBenefits : fallbackGrades)
    .filter((item) => item.isVisible)
    .sort((a, b) => a.level - b.level || a.order - b.order);
  const current = grades.find(
    (item) =>
      item.gradeCode === grade ||
      item.id === grade ||
      item.internalCode === grade,
  );
  const currentLevel = (current?.level ?? gradeLevel(grade, grades)) || 1;
  const allowed = grades
    .filter((item) => item.level <= currentLevel)
    .flatMap((item) => [item.gradeCode, item.internalCode].filter(Boolean));
  const numericGrades = Array.from(
    { length: Math.min(Math.max(currentLevel, 0), 10) },
    (_, index) => [`G${index + 1}`, `LEVEL_${index + 1}`],
  );
  return [
    ...new Set([PUBLIC_ACCESS_GRADE, ...allowed, ...numericGrades.flat()]),
  ].slice(0, 30);
};

export const useProductStore = defineStore("product", {
  state: () => ({
    products: [] as Product[],
    categories: [] as Category[],
    gradeBenefits: [] as GradeBenefit[],
    query: "",
    selectedCategoryId: "",
    initialized: false,
    catalogAccessKey: "",
    loading: false,
  }),
  getters: {
    visibleProducts: (state) => {
      const user = useAuthStore().profile;
      return state.products.filter((product) =>
        canViewProductWithCategories(
          product,
          state.categories,
          user,
          state.gradeBenefits,
        ),
      );
    },
    filteredProducts(): Product[] {
      const q = this.query.trim().toLowerCase();
      const categoryIds = new Set<string>();
      if (this.selectedCategoryId) {
        categoryIds.add(this.selectedCategoryId);
        let changed = true;
        while (changed) {
          changed = false;
          this.visibleCategories.forEach((category) => {
            if (
              category.parentId &&
              categoryIds.has(category.parentId) &&
              !categoryIds.has(category.id)
            ) {
              categoryIds.add(category.id);
              changed = true;
            }
          });
        }
      }
      return this.visibleProducts.filter((product) => {
        const matchesCategory =
          !this.selectedCategoryId ||
          product.categoryIds.some((categoryId) => categoryIds.has(categoryId));
        const matchesQuery =
          !q ||
          product.name.toLowerCase().includes(q) ||
          product.shortDescription.toLowerCase().includes(q) ||
          product.tags.some((tag) => tag.toLowerCase().includes(q));
        return matchesCategory && matchesQuery;
      });
    },
    visibleCategories: (state) => {
      const auth = useAuthStore();
      if (auth.isAdmin) {
        return state.categories
          .filter((category) => category.isVisible)
          .sort((a, b) => a.order - b.order);
      }
      return state.categories
        .filter((category) =>
          canViewCategory(category, auth.profile, state.gradeBenefits),
        )
        .sort((a, b) => a.order - b.order);
    },
    rootCategories(): Category[] {
      return this.visibleCategories.filter((category) => !category.parentId);
    },
    lowStockProducts: (state) =>
      state.products.filter(
        (product) => product.stock > 0 && product.stock <= 10,
      ),
  },
  actions: {
    async fetchCatalog(force = false) {
      const firebase = useNuxtApp().$firebase;
      const auth = useAuthStore();
      const loading = useGlobalLoading();
      this.loading = true;
      try {
        await loading.withLoading(async () => {
          if (firebase.enabled && firebase.db) {
            await auth.init();
            const accessKey = [
              auth.profile?.uid || "guest",
              auth.profile?.role || "customer",
              auth.profile?.userGrade || PUBLIC_ACCESS_GRADE,
              auth.profile?.isAdultVerified ? "adult" : "unverified",
            ].join(":");
            if (
              this.initialized &&
              this.catalogAccessKey === accessKey &&
              !force
            )
              return;
            const isAdmin = auth.isAdmin;
            const gradeSnap = await getDocs(
              query(
                collection(firebase.db, "gradeBenefits"),
                orderBy("order", "asc"),
              ),
            );
            const gradeBenefits = gradeSnap.docs.map((item) =>
              normalizeGradeBenefit(
                item.id,
                item.data() as Partial<GradeBenefit>,
              ),
            );
            const gradeFilter = allowedGradesFor(
              auth.profile?.userGrade,
              gradeBenefits,
            );
            const productConstraints = isAdmin
              ? [orderBy("updatedAt", "desc")]
              : [
                  where("isVisible", "==", true),
                  where("status", "==", "active"),
                  where("minUserGradeToView", "in", gradeFilter),
                  orderBy("updatedAt", "desc"),
                ];
            const legacyProductConstraints = [
              where("isVisible", "==", true),
              where("status", "==", "active"),
              where("minUserGradeToView", "==", null),
              orderBy("updatedAt", "desc"),
            ];
            const categoryConstraints = isAdmin
              ? [orderBy("order", "asc")]
              : [
                  where("isVisible", "==", true),
                  where("displayMinUserGradeToView", "in", gradeFilter),
                  orderBy("order", "asc"),
                ];
            const legacyCategoryConstraints = [
              where("isVisible", "==", true),
              where("displayMinUserGradeToView", "==", null),
              orderBy("order", "asc"),
            ];
            if (!auth.profile && !isAdmin) {
              const publicCatalog = await $fetch<{
                products: Array<Partial<Product> & { id: string }>;
                categories: Array<Partial<Category> & { id: string }>;
                gradeBenefits: Array<Partial<GradeBenefit> & { id: string }>;
              }>("/api/catalog/public");
              this.gradeBenefits = publicCatalog.gradeBenefits.map((item) =>
                normalizeGradeBenefit(item.id, item),
              );
              this.products = publicCatalog.products.map((item) =>
                normalizeProduct(item.id, item),
              );
              this.categories = publicCatalog.categories.map((item) =>
                normalizeCategory(item.id, item, this.gradeBenefits),
              );
              this.catalogAccessKey = accessKey;
              return;
            }

            const [
              productSnap,
              legacyProductSnap,
              categorySnap,
              legacyCategorySnap,
            ] = await Promise.all([
              getDocs(
                query(
                  collection(firebase.db, "products"),
                  ...productConstraints,
                ),
              ),
              isAdmin
                ? Promise.resolve(null)
                : getDocs(
                    query(
                      collection(firebase.db, "products"),
                      ...legacyProductConstraints,
                    ),
                  ),
              getDocs(
                query(
                  collection(firebase.db, "categories"),
                  ...categoryConstraints,
                ),
              ),
              isAdmin
                ? Promise.resolve(null)
                : getDocs(
                    query(
                      collection(firebase.db, "categories"),
                      ...legacyCategoryConstraints,
                    ),
                  ),
            ]);
            const productDocs = new Map(
              [...productSnap.docs, ...(legacyProductSnap?.docs || [])].map(
                (item) => [item.id, item],
              ),
            );
            const categoryDocs = new Map(
              [...categorySnap.docs, ...(legacyCategorySnap?.docs || [])].map(
                (item) => [item.id, item],
              ),
            );
            this.products = [...productDocs.values()].map((item) =>
              normalizeProduct(item.id, item.data() as Partial<Product>),
            );
            this.categories = [...categoryDocs.values()].map((item) =>
              normalizeCategory(
                item.id,
                item.data() as Partial<Category>,
                gradeBenefits,
              ),
            );
            this.gradeBenefits = gradeBenefits;
            this.catalogAccessKey = accessKey;
          } else {
            this.products = [];
            this.categories = [];
            this.gradeBenefits = [];
            this.catalogAccessKey = "disabled";
          }
          this.initialized = true;
        }, "카탈로그를 불러오는 중");
      } finally {
        this.loading = false;
      }
    },
    findBySlug(slug: string) {
      return this.products.find((product) => product.slug === slug);
    },
    findById(id: string) {
      return this.products.find((product) => product.id === id);
    },
    findCategoryBySlugOrId(value: string) {
      return this.categories.find(
        (category) => category.slug === value || category.id === value,
      );
    },
    categoryRouteValue(category: Pick<Category, "id" | "slug">) {
      return category.slug || category.id;
    },
    findGradeBenefit(id: string) {
      return this.gradeBenefits.find(
        (benefit) =>
          benefit.id === id ||
          benefit.gradeCode === id ||
          benefit.internalCode === id,
      );
    },
    setQuery(query: string) {
      this.query = query;
    },
    setCategory(categoryId: string) {
      this.selectedCategoryId = categoryId;
    },
    setCategoryFromRoute(value: string) {
      const category = value ? this.findCategoryBySlugOrId(value) : null;
      this.selectedCategoryId = category?.id || value || "";
    },
    async upsertProduct(product: Product) {
      const now = new Date().toISOString();
      const payload = { ...product, updatedAt: now };
      const index = this.products.findIndex((item) => item.id === product.id);
      if (index >= 0) this.products[index] = payload;
      else this.products.unshift(payload);
      const firebase = useNuxtApp().$firebase;
      if (firebase.enabled && firebase.db) {
        await useGlobalLoading().withLoading(async () => {
          await setDoc(
            doc(firebase.db!, "products", payload.id),
            { ...payload, updatedAt: serverTimestamp() },
            { merge: true },
          );
        }, "상품을 저장하는 중");
      }
    },
    async softDeleteProduct(id: string) {
      const product = this.findById(id);
      if (!product) return;
      await this.upsertProduct({
        ...product,
        status: "deleted",
        isVisible: false,
      });
    },
    async toggleVisibility(id: string) {
      const product = this.findById(id);
      if (!product) return;
      await this.upsertProduct({ ...product, isVisible: !product.isVisible });
    },
    async upsertCategory(category: Category) {
      const payload = {
        ...category,
        minUserGradeLevel:
          Number(category.minUserGradeLevel || 0) ||
          gradeLevel(category.minUserGradeToView, this.gradeBenefits),
        displayMinUserGradeToView: categoryDisplayGrade(category),
        displayMinUserGradeLevel:
          Number(category.displayMinUserGradeLevel || 0) ||
          gradeLevel(categoryDisplayGrade(category), this.gradeBenefits),
      };
      const index = this.categories.findIndex((item) => item.id === payload.id);
      if (index >= 0) this.categories[index] = payload;
      else this.categories.push(payload);
      const firebase = useNuxtApp().$firebase;
      if (firebase.enabled && firebase.db) {
        await useGlobalLoading().withLoading(async () => {
          await setDoc(doc(firebase.db!, "categories", payload.id), payload, {
            merge: true,
          });
        }, "카테고리를 저장하는 중");
      }
    },
    async removeCategory(id: string) {
      this.categories = this.categories.filter(
        (category) => category.id !== id,
      );
      const firebase = useNuxtApp().$firebase;
      if (firebase.enabled && firebase.db)
        await deleteDoc(doc(firebase.db, "categories", id));
    },
    async upsertGradeBenefit(benefit: GradeBenefit) {
      const now = new Date().toISOString();
      const payload = { ...benefit, updatedAt: now };
      const index = this.gradeBenefits.findIndex(
        (item) =>
          item.id === benefit.id || item.gradeCode === benefit.gradeCode,
      );
      if (index >= 0) this.gradeBenefits[index] = payload;
      else this.gradeBenefits.push(payload);
      const firebase = useNuxtApp().$firebase;
      if (firebase.enabled && firebase.db) {
        await useGlobalLoading().withLoading(async () => {
          await setDoc(
            doc(firebase.db!, "gradeBenefits", payload.id),
            { ...payload, updatedAt: serverTimestamp() },
            { merge: true },
          );
        }, "회원 등급을 저장하는 중");
      }
    },
    async removeGradeBenefit(id: string) {
      this.gradeBenefits = this.gradeBenefits.filter(
        (benefit) => benefit.id !== id && benefit.gradeCode !== id,
      );
      const firebase = useNuxtApp().$firebase;
      if (firebase.enabled && firebase.db) {
        await useGlobalLoading().withLoading(async () => {
          await deleteDoc(doc(firebase.db!, "gradeBenefits", id));
        }, "회원 등급을 삭제하는 중");
      }
    },
    async patchProduct(id: string, updates: Partial<Product>) {
      const product = this.findById(id);
      if (!product) return;
      Object.assign(product, updates, { updatedAt: new Date().toISOString() });
      const firebase = useNuxtApp().$firebase;
      if (firebase.enabled && firebase.db)
        await updateDoc(doc(firebase.db, "products", id), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
    },
  },
});
