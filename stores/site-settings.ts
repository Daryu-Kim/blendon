import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { defineStore } from "pinia";
import type { SiteGlobalSettings, SiteSeoSettings } from "~/types/domain";

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

const defaultHomeCategoryTileIds = [
  "device",
  "flavor",
  "nicotine-free",
  "consumable",
];
const defaultHomeBestCategoryIds = ["device", "nicotine-free", "consumable"];

const normalizeStringList = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return [...fallback];
  return value.map((item) => String(item).trim()).filter(Boolean);
};

const defaultGlobalSettings = (): SiteGlobalSettings => ({
  id: "global",
  mallName: "BLEND ON",
  mallDescription: "성인 취향을 쉽고 깔끔하게 고르는 라이프스타일 편집샵",
  adultOnly: true,
  requireAdultVerificationToBrowse: false,
  hideAdultVerificationStatusOnConsumer: true,
  businessName: "",
  representativeName: "",
  businessRegistrationNumber: "",
  mailOrderSalesNumber: "",
  businessAddress: "",
  customerCenterPhone: "0000-0000",
  customerCenterEmail: "support@example.com",
  baseDeliveryFee: 3000,
  storeMapUrl: "",
  depositBankName: "",
  depositAccountNumber: "",
  depositAccountHolder: "",
  homeCategoryTileIds: [...defaultHomeCategoryTileIds],
  homeBestCategoryIds: [...defaultHomeBestCategoryIds],
  productDetailTopBannerImageUrl: "",
  productDetailBottomBannerImageUrl: "",
  updatedAt: new Date().toISOString(),
});

const defaultSeoSettings = (): SiteSeoSettings => ({
  id: "seo",
  defaultTitle: "BLEND ON",
  titleTemplate: "%s | BLEND ON",
  defaultDescription: "성인 취향을 쉽고 깔끔하게 고르는 라이프스타일 편집샵",
  defaultKeywords: ["성인 라이프스타일", "편집샵", "디바이스", "플레이버"],
  ogTitle: "BLEND ON",
  ogDescription: "성인 취향을 쉽고 깔끔하게 고르는 라이프스타일 편집샵",
  ogImageUrl: "/og-image.svg",
  canonicalBaseUrl: "",
  robots: "index,follow",
  updatedAt: new Date().toISOString(),
});

const normalizeGlobalSettings = (
  data: Partial<SiteGlobalSettings>,
): SiteGlobalSettings => ({
  ...defaultGlobalSettings(),
  ...data,
  id: "global",
  adultOnly: data.adultOnly ?? true,
  requireAdultVerificationToBrowse:
    data.requireAdultVerificationToBrowse ?? false,
  hideAdultVerificationStatusOnConsumer:
    data.hideAdultVerificationStatusOnConsumer ?? true,
  baseDeliveryFee: Number(data.baseDeliveryFee ?? 3000),
  storeMapUrl: data.storeMapUrl || "",
  depositBankName: data.depositBankName || "",
  depositAccountNumber: data.depositAccountNumber || "",
  depositAccountHolder: data.depositAccountHolder || "",
  homeCategoryTileIds: normalizeStringList(
    data.homeCategoryTileIds,
    defaultHomeCategoryTileIds,
  ),
  homeBestCategoryIds: normalizeStringList(
    data.homeBestCategoryIds,
    defaultHomeBestCategoryIds,
  ),
  updatedAt: timestampToIso(data.updatedAt),
});

const normalizeSeoSettings = (
  data: Partial<SiteSeoSettings>,
): SiteSeoSettings => ({
  ...defaultSeoSettings(),
  ...data,
  id: "seo",
  defaultKeywords: Array.isArray(data.defaultKeywords)
    ? data.defaultKeywords
    : defaultSeoSettings().defaultKeywords,
  updatedAt: timestampToIso(data.updatedAt),
});

export const useSiteSettingsStore = defineStore("siteSettings", {
  state: () => ({
    global: defaultGlobalSettings(),
    seo: defaultSeoSettings(),
    initialized: false,
    loading: false,
  }),
  actions: {
    async fetchSettings(force = false) {
      if (this.initialized && !force) return;
      const firebase = useNuxtApp().$firebase;
      this.loading = true;
      try {
        await useGlobalLoading().withLoading(async () => {
          if (!firebase.enabled || !firebase.db) {
            this.global = defaultGlobalSettings();
            this.seo = defaultSeoSettings();
            this.initialized = true;
            return;
          }

          const [globalSnap, seoSnap] = await Promise.all([
            getDoc(doc(firebase.db, "siteSettings", "global")),
            getDoc(doc(firebase.db, "siteSettings", "seo")),
          ]);

          this.global = normalizeGlobalSettings(
            globalSnap.exists()
              ? (globalSnap.data() as Partial<SiteGlobalSettings>)
              : {},
          );
          this.seo = normalizeSeoSettings(
            seoSnap.exists() ? (seoSnap.data() as Partial<SiteSeoSettings>) : {},
          );
          this.initialized = true;
        }, "쇼핑몰 설정을 불러오는 중");
      } finally {
        this.loading = false;
      }
    },
    async saveGlobalSettings(settings: SiteGlobalSettings) {
      const payload = normalizeGlobalSettings({
        ...settings,
        adultOnly: true,
        hideAdultVerificationStatusOnConsumer: true,
        updatedAt: new Date().toISOString(),
      });
      this.global = payload;
      const firebase = useNuxtApp().$firebase;
      if (!firebase.enabled || !firebase.db) return;
      await useGlobalLoading().withLoading(async () => {
        await setDoc(
          doc(firebase.db!, "siteSettings", "global"),
          { ...payload, updatedAt: serverTimestamp() },
          { merge: true },
        );
      }, "쇼핑몰 기본 설정을 저장하는 중");
    },
    async saveSeoSettings(settings: SiteSeoSettings) {
      const payload = normalizeSeoSettings({
        ...settings,
        updatedAt: new Date().toISOString(),
      });
      this.seo = payload;
      const firebase = useNuxtApp().$firebase;
      if (!firebase.enabled || !firebase.db) return;
      await useGlobalLoading().withLoading(async () => {
        await setDoc(
          doc(firebase.db!, "siteSettings", "seo"),
          { ...payload, updatedAt: serverTimestamp() },
          { merge: true },
        );
      }, "SEO 설정을 저장하는 중");
    },
  },
});
