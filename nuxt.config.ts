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
  css: ["~/assets/css/main.css"],
  ignore: ["functions/**", ".output/**", ".firebase/**"],
  watchers: {
    chokidar: {
      ignored: ["**/functions/**", "**/.output/**", "**/.firebase/**"],
    },
  },
  nitro: {
    watchOptions: {
      ignored: ["**/functions/**", "**/.output/**", "**/.firebase/**"],
    },
  },
  vite: {
    server: {
      watch: {
        ignored: ["**/functions/**", "**/.output/**", "**/.firebase/**"],
      },
    },
  },
  typescript: {
    typeCheck: true,
    strict: true,
  },
  runtimeConfig: {
    portoneApiSecret: process.env.PORTONE_API_SECRET,
    firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    adminInitialEmail: process.env.ADMIN_INITIAL_EMAIL,
    public: {
      appEnv: process.env.NUXT_PUBLIC_APP_ENV || "local",
      enableMockAuth: process.env.NUXT_PUBLIC_ENABLE_MOCK_AUTH === "true",
      enableMockPayments:
        process.env.NUXT_PUBLIC_ENABLE_MOCK_PAYMENTS === "true",
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId:
        process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
      portoneStoreId: process.env.NUXT_PUBLIC_PORTONE_STORE_ID,
      portoneChannelKey: process.env.NUXT_PUBLIC_PORTONE_CHANNEL_KEY,
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
