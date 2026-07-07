import type { Product, SiteGlobalSettings, SiteSeoSettings } from "~/types/domain";
import { getFirebaseAdmin } from "~/server/utils/firebase-admin";

export interface PublicSeoSettings {
  defaultTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  defaultKeywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  canonicalBaseUrl: string;
  robots: string;
}

export interface PublicGlobalSettings {
  mallName: string;
  mallDescription: string;
  businessName: string;
  representativeName: string;
  businessRegistrationNumber: string;
  mailOrderSalesNumber: string;
  businessAddress: string;
  customerCenterPhone: string;
  customerCenterEmail: string;
  baseDeliveryFee: number;
  storeMapUrl: string;
  depositBankName: string;
  depositAccountNumber: string;
  depositAccountHolder: string;
  homeCategoryTileIds: string[];
  homeBestCategoryIds: string[];
  productDetailTopBannerImageUrl: string;
  productDetailBottomBannerImageUrl: string;
}

export interface PublicProductSeo {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  ogImageUrl: string;
  canonicalUrl: string;
}

export const defaultPublicSeoSettings = (): PublicSeoSettings => ({
  defaultTitle: "BLEND ON",
  titleTemplate: "%s | BLEND ON",
  defaultDescription: "성인 취향을 쉽고 깔끔하게 고르는 라이프스타일 편집샵",
  defaultKeywords: ["성인 라이프스타일", "편집샵", "디바이스", "플레이버"],
  ogTitle: "BLEND ON",
  ogDescription: "성인 취향을 쉽고 깔끔하게 고르는 라이프스타일 편집샵",
  ogImageUrl: "/og-image.svg",
  canonicalBaseUrl: "",
  robots: "index,follow",
});

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

export const defaultPublicGlobalSettings = (): PublicGlobalSettings => ({
  mallName: "BLEND ON",
  mallDescription: "성인 취향을 쉽고 깔끔하게 고르는 라이프스타일 편집샵",
  businessName: "상호 입력 예정",
  representativeName: "대표자 입력 예정",
  businessRegistrationNumber: "사업자등록번호 입력 예정",
  mailOrderSalesNumber: "통신판매업 신고번호 입력 예정",
  businessAddress: "사업장 주소 입력 예정",
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
});

export const getServerGlobalSettings =
  async (): Promise<PublicGlobalSettings> => {
    const admin = getFirebaseAdmin();
    if (!admin) return defaultPublicGlobalSettings();

    const snap = await admin.db.collection("siteSettings").doc("global").get();
    if (!snap.exists) return defaultPublicGlobalSettings();

    const data = snap.data() as Partial<SiteGlobalSettings>;
    return {
      ...defaultPublicGlobalSettings(),
      mallName: data.mallName || defaultPublicGlobalSettings().mallName,
      mallDescription:
        data.mallDescription ||
        defaultPublicGlobalSettings().mallDescription,
      businessName:
        data.businessName || defaultPublicGlobalSettings().businessName,
      representativeName:
        data.representativeName ||
        defaultPublicGlobalSettings().representativeName,
      businessRegistrationNumber:
        data.businessRegistrationNumber ||
        defaultPublicGlobalSettings().businessRegistrationNumber,
      mailOrderSalesNumber:
        data.mailOrderSalesNumber ||
        defaultPublicGlobalSettings().mailOrderSalesNumber,
      businessAddress:
        data.businessAddress || defaultPublicGlobalSettings().businessAddress,
      customerCenterPhone:
        data.customerCenterPhone ||
        defaultPublicGlobalSettings().customerCenterPhone,
      customerCenterEmail:
        data.customerCenterEmail ||
        defaultPublicGlobalSettings().customerCenterEmail,
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
      productDetailTopBannerImageUrl: data.productDetailTopBannerImageUrl || "",
      productDetailBottomBannerImageUrl:
        data.productDetailBottomBannerImageUrl || "",
    };
  };

export const getServerSeoSettings = async (): Promise<PublicSeoSettings> => {
  const admin = getFirebaseAdmin();
  if (!admin) return defaultPublicSeoSettings();

  const snap = await admin.db.collection("siteSettings").doc("seo").get();
  if (!snap.exists) return defaultPublicSeoSettings();

  const data = snap.data() as Partial<SiteSeoSettings>;
  return {
    ...defaultPublicSeoSettings(),
    defaultTitle: data.defaultTitle || defaultPublicSeoSettings().defaultTitle,
    titleTemplate:
      data.titleTemplate || defaultPublicSeoSettings().titleTemplate,
    defaultDescription:
      data.defaultDescription || defaultPublicSeoSettings().defaultDescription,
    defaultKeywords: Array.isArray(data.defaultKeywords)
      ? data.defaultKeywords
      : defaultPublicSeoSettings().defaultKeywords,
    ogTitle: data.ogTitle || defaultPublicSeoSettings().ogTitle,
    ogDescription:
      data.ogDescription || defaultPublicSeoSettings().ogDescription,
    ogImageUrl: data.ogImageUrl || defaultPublicSeoSettings().ogImageUrl,
    canonicalBaseUrl: data.canonicalBaseUrl || "",
    robots: data.robots || defaultPublicSeoSettings().robots,
  };
};

export const getServerProductSeo = async (
  slug: string,
): Promise<PublicProductSeo | null> => {
  const admin = getFirebaseAdmin();
  if (!admin) return null;

  const snap = await admin.db
    .collection("products")
    .where("slug", "==", slug)
    .where("isVisible", "==", true)
    .where("status", "==", "active")
    .limit(1)
    .get();
  const doc = snap.docs[0];
  if (!doc) return null;

  const product = doc.data() as Product;
  return {
    slug: product.slug,
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.shortDescription,
    keywords:
      product.seoKeywords?.length ? product.seoKeywords : product.tags || [],
    ogImageUrl: product.ogImageUrl || product.thumbnailUrl,
    canonicalUrl: product.canonicalUrl || `/products/${product.slug}`,
  };
};
