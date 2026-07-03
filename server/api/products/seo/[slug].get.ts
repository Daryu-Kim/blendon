import { getServerProductSeo } from "~/server/utils/seo-store";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug") || "";
  return getServerProductSeo(slug);
});
