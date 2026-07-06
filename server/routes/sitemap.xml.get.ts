import { getFirebaseAdmin } from "~/server/utils/firebase-admin";
import { getServerSeoSettings } from "~/server/utils/seo-store";
import type { Product } from "~/types/domain";

const PUBLIC_ACCESS_GRADE = "PUBLIC";

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toIsoDate = (value: unknown) => {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString().slice(0, 10);
  }
  if (typeof value === "string" && value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value.slice(0, 10) : date.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
};

const isPublicGrade = (grade?: unknown) =>
  !grade || grade === PUBLIC_ACCESS_GRADE;

const publicCategoryGrade = (category: Record<string, unknown>) =>
  category.displayMinUserGradeToView ||
  category.minUserGradeToView ||
  PUBLIC_ACCESS_GRADE;

const absoluteUrl = (baseUrl: string, path: string) => {
  if (/^https?:\/\//.test(path)) return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Content-Type", "application/xml; charset=utf-8");
  setResponseHeader(event, "Cache-Control", "no-store");

  const requestUrl = getRequestURL(event);
  const seo = await getServerSeoSettings();
  const baseUrl =
    seo.canonicalBaseUrl.replace(/\/$/, "") ||
    `${requestUrl.protocol}//${requestUrl.host}`;
  const urls: Array<{ loc: string; lastmod?: string }> = [
    { loc: absoluteUrl(baseUrl, "/") },
    { loc: absoluteUrl(baseUrl, "/products") },
  ];

  const admin = getFirebaseAdmin();
  if (admin) {
    const [productSnap, categorySnap] = await Promise.all([
      admin.db
        .collection("products")
        .where("isVisible", "==", true)
        .where("status", "==", "active")
        .get(),
      admin.db.collection("categories").where("isVisible", "==", true).get(),
    ]);
    const publicCategoryIds = new Set(
      categorySnap.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((category) => isPublicGrade(publicCategoryGrade(category)))
        .map((category) => category.id),
    );

    productSnap.docs.forEach((doc) => {
      const product = doc.data() as Product;
      if (!product.slug || !isPublicGrade(product.minUserGradeToView)) return;
      const categoryIds = Array.isArray(product.categoryIds)
        ? product.categoryIds
        : [];
      if (
        categoryIds.length &&
        !categoryIds.some((categoryId) => publicCategoryIds.has(categoryId))
      )
        return;
      urls.push({
        loc: absoluteUrl(
          baseUrl,
          product.canonicalUrl || `/products/${product.slug}`,
        ),
        lastmod: toIsoDate(product.updatedAt),
      });
    });
  }

  const body = urls
    .map(
      (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>${
      url.lastmod ? `\n    <lastmod>${escapeXml(url.lastmod)}</lastmod>` : ""
    }
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
});
