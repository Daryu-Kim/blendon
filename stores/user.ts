import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { defineStore } from "pinia";
import type { GradeCode, Role, UserProfile } from "~/types/domain";

const timestampToIso = (value: unknown) => {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date().toISOString();
};

const normalizeUser = (uid: string, data: Partial<UserProfile>): UserProfile =>
  ({
    uid,
    loginId: data.loginId || data.email || uid,
    email: data.email || "",
    displayName: data.displayName || "",
    phoneNumber: data.phoneNumber || "",
    birthDate: data.birthDate || "",
    isAdultVerified: Boolean(data.isAdultVerified),
    adultVerifiedAt: data.adultVerifiedAt || null,
    adultVerificationProvider: data.adultVerificationProvider || null,
    userGrade: data.userGrade || "BASIC",
    role: data.role || "customer",
    availablePoint: Number(data.availablePoint || 0),
    totalPurchaseAmount: Number(data.totalPurchaseAmount || 0),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    defaultAddress: data.defaultAddress || null,
    termsAgreement: data.termsAgreement || {
      service: { accepted: false, agreedAt: null },
      privacy: { accepted: false, agreedAt: null },
      refund: { accepted: false, agreedAt: null },
      marketing: { accepted: false, agreedAt: null },
      nightMarketing: { accepted: false, agreedAt: null },
      agreedAt: null,
    },
    adminMemo: data.adminMemo || "",
  }) satisfies UserProfile;

export const useUserStore = defineStore("user", {
  state: () => ({
    users: [] as UserProfile[],
    initialized: false,
    loading: false,
  }),
  getters: {
    currentProfile: () => useAuthStore().profile,
    adultVerifiedCount: (state) =>
      state.users.filter((user) => user.isAdultVerified).length,
    newUserCount: (state) => state.users.length,
  },
  actions: {
    async fetchUsers(force = false) {
      if (this.initialized && !force) return;
      const firebase = useNuxtApp().$firebase;
      this.loading = true;
      try {
        await useGlobalLoading().withLoading(async () => {
          if (!firebase.enabled || !firebase.db) {
            this.users = [];
            this.initialized = true;
            return;
          }
          const snap = await getDocs(
            query(collection(firebase.db, "users"), orderBy("createdAt", "desc")),
          );
          this.users = snap.docs.map((item) =>
            normalizeUser(item.id, item.data() as Partial<UserProfile>),
          );
          this.initialized = true;
        }, "회원 정보를 불러오는 중");
      } finally {
        this.loading = false;
      }
    },
    upsertUser(profile: UserProfile) {
      const index = this.users.findIndex((user) => user.uid === profile.uid);
      if (index >= 0) this.users[index] = profile;
      else this.users.unshift(profile);
    },
    async patchUser(uid: string, updates: Partial<UserProfile>) {
      const user = this.users.find((item) => item.uid === uid);
      if (user) Object.assign(user, updates, { updatedAt: new Date().toISOString() });
      const firebase = useNuxtApp().$firebase;
      if (!firebase.enabled || !firebase.db) return;
      await useGlobalLoading().withLoading(async () => {
        await updateDoc(doc(firebase.db!, "users", uid), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      }, "회원 정보를 저장하는 중");
    },
    updateUserRole(uid: string, role: Role) {
      return this.patchUser(uid, { role });
    },
    updateUserGrade(uid: string, userGrade: GradeCode) {
      return this.patchUser(uid, { userGrade });
    },
    updateUserPoint(uid: string, availablePoint: number) {
      return this.patchUser(uid, { availablePoint });
    },
  },
});
