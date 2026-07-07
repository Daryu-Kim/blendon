import {
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { defineStore } from "pinia";
import { hasAdminAccess } from "~/utils/access";
import { toUserMessage } from "~/utils/error-message";
import type {
  AgreementConsent,
  TermsAgreement,
  UserProfile,
} from "~/types/domain";

const storageKey = "blend-on-auth-session";

interface AuthSessionState {
  uid: string;
  loginId: string;
  email: string;
  displayName: string;
  role: UserProfile["role"];
  userGrade: UserProfile["userGrade"];
  userGradeLevel?: number;
  isAdultVerified: boolean;
  savedAt: string;
}

export interface SignUpProfileInput {
  loginId: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  birthDate?: string;
  termsAgreement: TermsAgreement;
}

const consent = (
  accepted = false,
  agreedAt: string | null = null,
): AgreementConsent => ({ accepted, agreedAt });

const defaultTermsAgreement = (): TermsAgreement => ({
  service: consent(),
  privacy: consent(),
  refund: consent(),
  marketing: consent(),
  nightMarketing: consent(),
  agreedAt: null,
});

const defaultGrade = async () => {
  const firebase = useNuxtApp().$firebase;
  if (!firebase.enabled || !firebase.db) return { gradeCode: "BASIC", level: 1 };
  try {
    const snap = await getDocs(
      query(collection(firebase.db, "gradeBenefits"), orderBy("level", "asc")),
    );
    const firstVisible = snap.docs
      .map(
        (item) =>
          item.data() as {
            gradeCode?: string;
            level?: number;
            isVisible?: boolean;
          },
      )
      .find((grade) => grade.isVisible !== false && grade.gradeCode);
    return {
      gradeCode: firstVisible?.gradeCode || "BASIC",
      level: Number(firstVisible?.level || 1),
    };
  } catch {
    return { gradeCode: "BASIC", level: 1 };
  }
};

const createDefaultProfile = (
  uid: string,
  email: string,
  displayName = "블렌드 고객",
  input?: Partial<SignUpProfileInput>,
  userGrade = "BASIC",
  userGradeLevel = 1,
): UserProfile => {
  const now = new Date().toISOString();
  return {
    uid,
    loginId: input?.loginId || email,
    email,
    displayName,
    phoneNumber: input?.phoneNumber || "",
    birthDate: input?.birthDate || "",
    isAdultVerified: false,
    adultVerifiedAt: null,
    adultVerificationProvider: null,
    userGrade,
    userGradeLevel,
    gradeEvaluatedAt: null,
    gradePurchaseAmount6Months: 0,
    isGradeLocked: false,
    gradeLockedAt: null,
    gradeLockedBy: null,
    gradeLockReason: "",
    role: "customer",
    availablePoint: 0,
    totalPurchaseAmount: 0,
    createdAt: now,
    updatedAt: now,
    defaultAddress: null,
    termsAgreement: input?.termsAgreement || defaultTermsAgreement(),
  };
};

const normalizeConsent = (
  value: unknown,
  fallbackAt: string | null,
): AgreementConsent => {
  if (typeof value === "boolean")
    return consent(value, value ? fallbackAt : null);
  if (value && typeof value === "object" && "accepted" in value) {
    const record = value as Partial<AgreementConsent>;
    return consent(
      Boolean(record.accepted),
      record.agreedAt || (record.accepted ? fallbackAt : null),
    );
  }
  return consent();
};

const normalizeTermsAgreement = (
  terms?: Partial<TermsAgreement> | Record<string, unknown>,
): TermsAgreement => {
  const fallbackAt =
    typeof terms?.agreedAt === "string" ? terms.agreedAt : null;
  return {
    service: normalizeConsent(terms?.service, fallbackAt),
    privacy: normalizeConsent(terms?.privacy, fallbackAt),
    refund: normalizeConsent(terms?.refund, fallbackAt),
    marketing: normalizeConsent(terms?.marketing, fallbackAt),
    nightMarketing: normalizeConsent(terms?.nightMarketing, fallbackAt),
    agreedAt: fallbackAt,
  };
};

const normalizeProfile = (profile: UserProfile): UserProfile => ({
  ...profile,
  userGradeLevel: Number(profile.userGradeLevel || 1),
  gradeEvaluatedAt: profile.gradeEvaluatedAt || null,
  gradePurchaseAmount6Months: Number(profile.gradePurchaseAmount6Months || 0),
  isGradeLocked: Boolean(profile.isGradeLocked),
  gradeLockedAt: profile.gradeLockedAt || null,
  gradeLockedBy: profile.gradeLockedBy || null,
  gradeLockReason: profile.gradeLockReason || "",
  termsAgreement: normalizeTermsAgreement(profile.termsAgreement),
});

const toSessionState = (profile: UserProfile): AuthSessionState => ({
  uid: profile.uid,
  loginId: profile.loginId,
  email: profile.email,
  displayName: profile.displayName,
  role: profile.role,
  userGrade: profile.userGrade,
  userGradeLevel: profile.userGradeLevel,
  isAdultVerified: profile.isAdultVerified,
  savedAt: new Date().toISOString(),
});

const writeStoredProfile = (profile: UserProfile | null) => {
  if (!import.meta.client) return;
  if (!profile) sessionStorage.removeItem(storageKey);
  else
    sessionStorage.setItem(storageKey, JSON.stringify(toSessionState(profile)));
};

export const useAuthStore = defineStore("auth", {
  state: () => ({
    profile: null as UserProfile | null,
    initialized: false,
    loading: false,
    error: "",
  }),
  getters: {
    user: (state) => state.profile,
    isLoggedIn: (state) => Boolean(state.profile),
    isAdultVerified: (state) => Boolean(state.profile?.isAdultVerified),
    isAdmin: (state) => hasAdminAccess(state.profile),
  },
  actions: {
    async init() {
      if (this.initialized || !import.meta.client) return;
      const nuxtApp = useNuxtApp();
      const firebase = nuxtApp.$firebase;

      if (!firebase.enabled || !firebase.auth || !firebase.db) {
        this.profile = null;
        this.initialized = true;
        return;
      }

      await setPersistence(firebase.auth, browserSessionPersistence);

      await new Promise<void>((resolve) => {
        onAuthStateChanged(firebase.auth!, async (user) => {
          if (!user) {
            this.profile = null;
            writeStoredProfile(null);
            this.initialized = true;
            resolve();
            return;
          }

          const ref = doc(firebase.db!, "users", user.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            this.profile = normalizeProfile(snap.data() as UserProfile);
          } else {
            const defaultUserGrade = await defaultGrade();
            this.profile = createDefaultProfile(
              user.uid,
              user.email || "",
              user.displayName || "블렌드 고객",
              undefined,
              defaultUserGrade.gradeCode,
              defaultUserGrade.level,
            );
          }
          writeStoredProfile(this.profile);
          this.initialized = true;
          resolve();
        });
      });
    },
    async signIn(email: string, password: string) {
      this.loading = true;
      this.error = "";
      try {
        return await useGlobalLoading().withLoading(async () => {
          const firebase = useNuxtApp().$firebase;
          if (firebase.enabled && firebase.auth && firebase.db) {
            await setPersistence(firebase.auth, browserSessionPersistence);
            const credential = await signInWithEmailAndPassword(
              firebase.auth,
              email,
              password,
            );
            const snap = await getDoc(
              doc(firebase.db, "users", credential.user.uid),
            );
            this.profile = snap.exists()
              ? normalizeProfile(snap.data() as UserProfile)
              : createDefaultProfile(
                  credential.user.uid,
                  email,
                  credential.user.displayName || "블렌드 고객",
                );
            writeStoredProfile(this.profile);
            return this.profile;
          }

          throw new Error("Firebase Authentication 설정이 필요합니다.");
        }, "로그인 처리 중");
      } catch (error) {
        this.error = toUserMessage(
          error,
          "로그인에 실패했어요. 입력한 정보를 다시 확인해 주세요.",
        );
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async signUp(
      email: string,
      password: string,
      displayName: string,
      input?: Partial<SignUpProfileInput>,
      verificationToken?: string,
    ) {
      this.loading = true;
      this.error = "";
      try {
        return await useGlobalLoading().withLoading(async () => {
          await $fetch("/api/auth/signup", {
            method: "POST",
            body: {
              email,
              password,
              loginId: input?.loginId || "",
              displayName,
              phoneNumber: input?.phoneNumber || "",
              termsAgreement: input?.termsAgreement,
              verificationToken,
            },
          });
          return await this.signIn(email, password);
        }, "회원가입 처리 중");
      } catch (error) {
        this.error = toUserMessage(
          error,
          "회원가입에 실패했어요. 입력한 정보를 다시 확인해 주세요.",
        );
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async signOut() {
      const firebase = useNuxtApp().$firebase;
      if (firebase.enabled && firebase.auth)
        await firebaseSignOut(firebase.auth);
      this.profile = null;
      writeStoredProfile(null);
    },
    async saveProfile(updates: Partial<UserProfile>) {
      if (!this.profile) return;
      const updated = {
        ...this.profile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.profile = updated;
      writeStoredProfile(updated);
      const firebase = useNuxtApp().$firebase;
      if (firebase.enabled && firebase.db) {
        await updateDoc(doc(firebase.db, "users", updated.uid), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      }
    },
    async markAdultVerified(provider: string, birthDate: string) {
      if (!this.profile) return;
      const verifiedProfile: UserProfile = {
        ...this.profile,
        birthDate,
        isAdultVerified: true,
        adultVerifiedAt: new Date().toISOString(),
        adultVerificationProvider: provider,
        updatedAt: new Date().toISOString(),
      };
      this.profile = verifiedProfile;
      writeStoredProfile(verifiedProfile);

      const firebase = useNuxtApp().$firebase;
      if (!firebase.enabled) {
        return;
      }

      // In production, protected adult verification fields are written by the server API/Admin SDK.
      // The client only refreshes local state so Firestore Rules can keep users from self-verifying.
    },
  },
});
