import { getServerGlobalSettings } from "~/server/utils/seo-store";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  return getServerGlobalSettings();
});
