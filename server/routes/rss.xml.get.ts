import { getFirebaseAdmin } from "~/server/utils/firebase-admin";
import {
  getServerGlobalSettings,
  getServerSeoSettings,
} from "~/server/utils/seo-store";
import type { Notice, Product } from "~/types/domain";

const PUBLIC_ACCESS_GRADE = "PUBLIC";
const maxFeedItems = 50;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const cdata = (value: string) => `<![CDATA[${value.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;

const toDate = (value: unknown) => {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    const date = value.toDate() as Date;
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }
  if (typeof value === "string" && value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }
  return new Date();
};

const toRfc822 = (value: unknown) => toDate(value).toUTCString();

const absoluteUrl = (baseUrl: string, path: string) => {
  if (/^https?:\/\//.test(path)) return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

const isPublicGrade = (grade?: unknown) =>
  !grade || grade === PUBLIC_ACCESS_GRADE;

const publicCategoryGrade = (category: Record<string, unknown>) =>
  category.displayMinUserGradeToView ||
  category.minUserGradeToView ||
  PUBLIC_ACCESS_GRADE;

interface FeedItem {
  title: string;
  link: string;
  guid: string;
  description: string;
  pubDate: string;
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Content-Type", "application/rss+xml; charset=utf-8");
  setResponseHeader(event, "Cache-Control", "no-store");

  const requestUrl = getRequestURL(event);
  const [seo, global] = await Promise.all([
    getServerSeoSettings(),
    getServerGlobalSettings(),
  ]);
  const baseUrl =
    seo.canonicalBaseUrl.replace(/\/$/, "") ||
    `${requestUrl.protocol}//${requestUrl.host}`;
  const items: FeedItem[] = [];
  const admin = getFirebaseAdmin();

  if (admin) {
    const [noticeSnap, productSnap, categorySnap] = await Promise.all([
      admin.db
        .collection("notices")
        .orderBy("createdAt", "desc")
        .limit(30)
        .get()
        .catch(() => null),
      admin.db
        .collection("products")
        .where("isVisible", "==", true)
        .where("status", "==", "active")
        .get()
        .catch(() => null),
      admin.db
        .collection("categories")
        .where("isVisible", "==", true)
        .get()
        .catch(() => null),
    ]);
    noticeSnap?.docs.forEach((doc) => {
      const notice = doc.data() as Notice;
      if (!notice.title || !notice.content) return;
      const link = absoluteUrl(baseUrl, `/notices/${doc.id}`);
      items.push({
        title: notice.title,
        link,
        guid: link,
        description: notice.content,
        pubDate: toRfc822(notice.updatedAt || notice.createdAt),
      });
    });

    const publicCategoryIds = new Set(
      categorySnap?.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((category) => isPublicGrade(publicCategoryGrade(category)))
        .map((category) => category.id) || [],
    );
    productSnap?.docs
      .map((doc) => doc.data() as Product)
      .filter((product) => {
        if (!product.slug || !isPublicGrade(product.minUserGradeToView))
          return false;
        if (
          product.isAdultOnly ||
          product.isPriceHiddenBeforeAdultVerification ||
          product.isPriceHiddenBeforeLogin
        )
          return false;
        const categoryIds = Array.isArray(product.categoryIds)
          ? product.categoryIds
          : [];
        return (
          !categoryIds.length ||
          categoryIds.some((categoryId) => publicCategoryIds.has(categoryId))
        );
      })
      .sort((a, b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime())
      .slice(0, 30)
      .forEach((product) => {
        const link = absoluteUrl(
          baseUrl,
          product.canonicalUrl || `/products/${product.slug}`,
        );
        items.push({
          title: product.seoTitle || product.name,
          link,
          guid: link,
          description:
            product.seoDescription ||
            product.description ||
            product.shortDescription,
          pubDate: toRfc822(product.updatedAt || product.createdAt),
        });
      });
  }

  if (!items.length) {
    const link = absoluteUrl(baseUrl, "/");
    items.push({
      title: global.mallName || seo.ogTitle || seo.defaultTitle,
      link,
      guid: link,
      description:
        global.mallDescription ||
        seo.ogDescription ||
        seo.defaultDescription,
      pubDate: new Date().toUTCString(),
    });
  }

  const feedItems = items
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, maxFeedItems)
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.guid)}</guid>
      <description>${cdata(item.description)}</description>
      <pubDate>${escapeXml(item.pubDate)}</pubDate>
    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(seo.ogTitle || global.mallName || seo.defaultTitle)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(
      seo.ogDescription || global.mallDescription || seo.defaultDescription,
    )}</description>
    <language>ko-KR</language>
    <lastBuildDate>${escapeXml(new Date().toUTCString())}</lastBuildDate>
${feedItems}
  </channel>
</rss>`;
});
