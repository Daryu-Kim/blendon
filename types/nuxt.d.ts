import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";

declare module "#app" {
  interface NuxtApp {
    $firebase: {
      enabled: boolean;
      app: FirebaseApp | null;
      auth: Auth | null;
      db: Firestore | null;
      storage: FirebaseStorage | null;
    };
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $firebase: {
      enabled: boolean;
      app: FirebaseApp | null;
      auth: Auth | null;
      db: Firestore | null;
      storage: FirebaseStorage | null;
    };
  }
}

declare global {
  interface Window {
    PortOne?: unknown;
  }
}

export {};
