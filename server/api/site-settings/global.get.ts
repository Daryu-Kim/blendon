import { getServerGlobalSettings } from "~/server/utils/seo-store";

export default defineEventHandler(async () => getServerGlobalSettings());
