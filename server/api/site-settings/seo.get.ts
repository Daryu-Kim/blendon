import { getServerSeoSettings } from "~/server/utils/seo-store";

export default defineEventHandler(async () => getServerSeoSettings());
