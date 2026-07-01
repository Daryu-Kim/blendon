import { defineStore } from "pinia";
import { mockUsers } from "~/data/mock";
import type { GradeCode, Role, UserProfile } from "~/types/domain";

export const useUserStore = defineStore("user", {
  state: () => ({
    users: [...mockUsers] as UserProfile[],
  }),
  getters: {
    currentProfile: () => useAuthStore().profile,
    adultVerifiedCount: (state) =>
      state.users.filter((user) => user.isAdultVerified).length,
    newUserCount: (state) => state.users.length,
  },
  actions: {
    upsertUser(profile: UserProfile) {
      const index = this.users.findIndex((user) => user.uid === profile.uid);
      if (index >= 0) this.users[index] = profile;
      else this.users.unshift(profile);
    },
    updateUserRole(uid: string, role: Role) {
      const user = this.users.find((item) => item.uid === uid);
      if (user) user.role = role;
    },
    updateUserGrade(uid: string, userGrade: GradeCode) {
      const user = this.users.find((item) => item.uid === uid);
      if (user) user.userGrade = userGrade;
    },
    updateUserPoint(uid: string, availablePoint: number) {
      const user = this.users.find((item) => item.uid === uid);
      if (user) user.availablePoint = availablePoint;
    },
  },
});
