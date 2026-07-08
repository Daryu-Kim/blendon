import {
  collection,
  doc,
  getDocs,
  getDoc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { defineStore } from "pinia";
import type { GradeCode, PointLog, Role, UserProfile } from "~/types/domain";

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
    userGradeLevel: Number(data.userGradeLevel || 1),
    gradeEvaluatedAt: data.gradeEvaluatedAt || null,
    gradePurchaseAmount6Months: Number(data.gradePurchaseAmount6Months || 0),
    isGradeLocked: Boolean(data.isGradeLocked),
    gradeLockedAt: data.gradeLockedAt || null,
    gradeLockedBy: data.gradeLockedBy || null,
    gradeLockReason: data.gradeLockReason || "",
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

const normalizePointLog = (id: string, data: Partial<PointLog>): PointLog =>
  ({
    id,
    userId: data.userId || "",
    type: data.type || "adjust",
    reason: data.reason || "other",
    amount: Number(data.amount || 0),
    balanceBefore: Number(data.balanceBefore || 0),
    balanceAfter: Number(data.balanceAfter || 0),
    orderId: data.orderId || null,
    orderNo: data.orderNo || null,
    adminId: data.adminId || null,
    adminEmail: data.adminEmail || null,
    memo: data.memo || "",
    createdAt: timestampToIso(data.createdAt),
  }) satisfies PointLog;

export const useUserStore = defineStore("user", {
  state: () => ({
    users: [] as UserProfile[],
    pointLogsByUser: {} as Record<string, PointLog[]>,
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
            query(
              collection(firebase.db, "users"),
              orderBy("createdAt", "desc"),
            ),
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
    async fetchUser(uid: string) {
      const cached = this.users.find((user) => user.uid === uid);
      if (cached) return cached;
      const firebase = useNuxtApp().$firebase;
      if (!firebase.enabled || !firebase.db) return null;
      const snap = await getDoc(doc(firebase.db, "users", uid));
      if (!snap.exists()) return null;
      const user = normalizeUser(snap.id, snap.data() as Partial<UserProfile>);
      this.upsertUser(user);
      return user;
    },
    upsertUser(profile: UserProfile) {
      const index = this.users.findIndex((user) => user.uid === profile.uid);
      if (index >= 0) this.users[index] = profile;
      else this.users.unshift(profile);
    },
    async patchUser(uid: string, updates: Partial<UserProfile>) {
      const user = this.users.find((item) => item.uid === uid);
      if (user)
        Object.assign(user, updates, { updatedAt: new Date().toISOString() });
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
      const grade = useProductStore().findGradeBenefit(userGrade);
      return this.patchUser(uid, {
        userGrade,
        userGradeLevel: grade?.level || 1,
      });
    },
    async updateUserGradeLock(
      uid: string,
      isGradeLocked: boolean,
      gradeLockReason = "",
    ) {
      const auth = useAuthStore();
      await this.patchUser(uid, {
        isGradeLocked,
        gradeLockedAt: isGradeLocked ? new Date().toISOString() : null,
        gradeLockedBy: isGradeLocked ? auth.profile?.uid || null : null,
        gradeLockReason: isGradeLocked ? gradeLockReason : "",
      });
    },
    async fetchPointLogs(uid: string, force = false) {
      if (this.pointLogsByUser[uid]?.length && !force) {
        return this.pointLogsByUser[uid];
      }
      const firebase = useNuxtApp().$firebase;
      if (!firebase.enabled || !firebase.db) {
        this.pointLogsByUser[uid] = [];
        return [];
      }
      const snap = await getDocs(
        query(
          collection(firebase.db, "pointLogs"),
          where("userId", "==", uid),
          orderBy("createdAt", "desc"),
          limit(50),
        ),
      );
      const logs = snap.docs.map((item) =>
        normalizePointLog(item.id, item.data() as Partial<PointLog>),
      );
      this.pointLogsByUser[uid] = logs;
      return logs;
    },
    async adjustUserPoint(uid: string, amount: number, memo: string) {
      const firebase = useNuxtApp().$firebase;
      const token = await firebase.auth?.currentUser?.getIdToken();
      if (!token) throw new Error("관리자 로그인이 필요합니다.");
      const normalizedAmount = Math.trunc(Number(amount || 0));
      if (normalizedAmount === 0) {
        throw new Error("지급 또는 차감할 포인트를 입력해 주세요.");
      }

      await useGlobalLoading().withLoading(async () => {
        const result = await $fetch<{ availablePoint: number; log: PointLog }>(
          "/api/admin/members/points/adjust",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: {
              uid,
              amount: normalizedAmount,
              memo,
            },
          },
        );
        const user = this.users.find((item) => item.uid === uid);
        if (user) {
          user.availablePoint = result.availablePoint;
          user.updatedAt = new Date().toISOString();
        }
        this.pointLogsByUser[uid] = [
          result.log,
          ...(this.pointLogsByUser[uid] || []),
        ];
      }, "포인트를 처리하는 중");
    },
    async sendPasswordResetEmail(uid: string) {
      const firebase = useNuxtApp().$firebase;
      const token = await firebase.auth?.currentUser?.getIdToken();
      if (!token) throw new Error("관리자 로그인이 필요합니다.");

      const user =
        this.users.find((item) => item.uid === uid) ||
        (await this.fetchUser(uid));
      if (!user?.email) throw new Error("회원 이메일을 찾을 수 없습니다.");

      await useGlobalLoading().withLoading(async () => {
        await $fetch("/api/admin/members/reset-password", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: { uid, email: user.email },
        });
      }, "비밀번호 재설정 메일을 발송하는 중");
    },
  },
});
