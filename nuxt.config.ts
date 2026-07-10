import { brandConfig } from "./config/brand";

export default defineNuxtConfig({
  compatibilityDate: "2026-06-29",
  devtools: { enabled: true },
  experimental: {
    // The app manifest is not required for this storefront yet. Keeping it off
    // avoids dev-server stalls when .nuxt artifacts are regenerated during local
    // typecheck/build runs.
    appManifest: false,
  },
  modules: ["@pinia/nuxt", "@nuxt/eslint"],
  css: ["md-editor-v3/lib/style.css", "~/assets/css/main.css"],
  ignore: [
    "functions/**",
    ".output/**",
    ".firebase/**",
    ".nuxt/dist/**",
    ".nuxt/analyze/**",
  ],
  watchers: {
    chokidar: {
      ignored: [
        "**/functions/**",
        "**/.output/**",
        "**/.firebase/**",
        "**/.nuxt/dist/**",
        "**/.nuxt/analyze/**",
      ],
    },
  },
  nitro: {
    watchOptions: {
      ignored: [
        "**/functions/**",
        "**/.output/**",
        "**/.firebase/**",
        "**/.nuxt/dist/**",
        "**/.nuxt/analyze/**",
      ],
    },
  },
  vite: {
    server: {
      watch: {
        ignored: [
          "**/functions/**",
          "**/.output/**",
          "**/.firebase/**",
          "**/.nuxt/dist/**",
          "**/.nuxt/analyze/**",
        ],
      },
    },
  },
  typescript: {
    typeCheck: true,
    strict: true,
  },
  routeRules: {
    "/products/**": { headers: { "cache-control": "no-store" } },
    "/api/products/**": { headers: { "cache-control": "no-store" } },
    "/api/site-settings/**": { headers: { "cache-control": "no-store" } },
    "/sitemap.xml": { headers: { "cache-control": "no-store" } },
    "/rss.xml": { headers: { "cache-control": "no-store" } },
    "/robots.txt": { headers: { "cache-control": "no-store" } },
  },
  runtimeConfig: {
    firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    adminInitialEmail: process.env.ADMIN_INITIAL_EMAIL,
    apickAuthKey: process.env.APICK_AUTH_KEY,
    ppurioApiBaseUrl:
      process.env.PPURIO_API_BASE_URL || "https://message.ppurio.com",
    ppurioAccount: process.env.PPURIO_ACCOUNT,
    ppurioAuthKey: process.env.PPURIO_AUTH_KEY,
    ppurioSenderNumber: process.env.PPURIO_SENDER_NUMBER,
    ppurioFunctionUrl: process.env.PPURIO_FUNCTION_URL,
    ppurioFunctionSecret: process.env.PPURIO_FUNCTION_SECRET,
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || "gpt-5.5",
    public: {
      appEnv: process.env.NUXT_PUBLIC_APP_ENV || "local",
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId:
        process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
      brand: brandConfig,
    },
  },
  app: {
    head: {
      titleTemplate: `%s | ${brandConfig.name}`,
      htmlAttrs: { lang: "ko" },
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: brandConfig.description },
        { property: "og:title", content: brandConfig.name },
        { property: "og:description", content: brandConfig.description },
        { property: "og:type", content: "website" },
        { property: "og:image", content: "/og-image.svg" },
        { name: "theme-color", content: brandConfig.colors.primary },
      ],
      link: [
        { rel: "preconnect", href: "https://cdn.jsdelivr.net" },
        {
          rel: "stylesheet",
          href: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css",
        },
      ],
    },
  },
});
