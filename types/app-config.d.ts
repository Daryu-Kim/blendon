import type { BrandConfig } from "~/types/domain";

declare module "nuxt/schema" {
  interface AppConfig {
    brand: BrandConfig;
  }
}

export {};
