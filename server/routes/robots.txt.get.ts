import { getServerSeoSettings } from "~/server/utils/seo-store";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Content-Type", "text/plain; charset=utf-8");
  setResponseHeader(event, "Cache-Control", "no-store");

  const requestUrl = getRequestURL(event);
  const seo = await getServerSeoSettings();
  const baseUrl =
    seo.canonicalBaseUrl.replace(/\/$/, "") ||
    `${requestUrl.protocol}//${requestUrl.host}`;
  const disallowAll = seo.robots.toLowerCase().includes("noindex");

  return [
    "User-agent: *",
    disallowAll ? "Disallow: /" : "Allow: /",
    "Disallow: /admin",
    "Disallow: /cart",
    "Disallow: /checkout",
    "Disallow: /orders",
    "Disallow: /mypage",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    "",
  ].join("\n");
});
