<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>회원 관리</h1>
        <p>성인 인증 상태, 등급, 포인트, 권한을 관리합니다.</p>
      </div>
    </div>

    <AdminTable :rows="users.users" :columns="columns" row-key="uid">
      <template #isAdultVerified="{ row }">{{
        row.isAdultVerified ? "인증 완료" : "미인증"
      }}</template>
      <template #availablePoint="{ row }">{{
        formatCurrency(row.availablePoint)
      }}</template>
      <template #actions="{ row }">
        <div class="row-actions">
          <Select
            :model-value="row.userGrade"
            @update:model-value="
              users.updateUserGrade(row.uid, $event as typeof row.userGrade)
            "
          >
            <option v-for="grade in grades" :key="grade" :value="grade">
              {{ grade }}
            </option>
          </Select>
          <Select
            :model-value="row.role"
            @update:model-value="
              users.updateUserRole(row.uid, $event as typeof row.role)
            "
          >
            <option value="customer">customer</option>
            <option value="staff">staff</option>
            <option value="manager">manager</option>
            <option value="admin">admin</option>
            <option value="owner">owner</option>
          </Select>
        </div>
      </template>
    </AdminTable>
  </main>
</template>

<script setup lang="ts">
import { formatCurrency } from "~/utils/format";
import type { GradeCode } from "~/types/domain";

definePageMeta({ layout: "admin", middleware: "admin" });
const users = useUserStore();
const grades: GradeCode[] = ["BASIC", "PLUS", "PRO", "VIP", "BLACK"];
const columns = [
  { key: "email", label: "이메일" },
  { key: "displayName", label: "이름" },
  { key: "isAdultVerified", label: "성인 인증" },
  { key: "userGrade", label: "등급" },
  { key: "role", label: "권한" },
  { key: "availablePoint", label: "포인트" },
] as const;

onMounted(async () => {
  await users.fetchUsers(true);
});

useHead({ title: "관리자 회원 관리" });
</script>

<style scoped>
.row-actions {
  display: grid;
  grid-template-columns: 120px 130px;
  gap: 8px;
}
</style>
