import { getServerProductSeo } from "~/server/utils/seo-store";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  const slug = getRouterParam(event, "slug") || "";
  return getServerProductSeo(slug);
});
