<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>회원 관리</h1>
        <p>회원 검색, 성인 인증 상태, 등급, 포인트, 권한을 관리합니다.</p>
      </div>
    </div>

    <section class="surface member-search">
      <Input
        v-model="keyword"
        placeholder="이메일, 아이디, 이름, 휴대폰 번호 검색"
      />
      <Select v-model="gradeFilter">
        <option value="">전체 등급</option>
        <option
          v-for="grade in activeGrades"
          :key="grade.gradeCode"
          :value="grade.gradeCode"
        >
          {{ grade.label }} ({{ grade.gradeCode }})
        </option>
      </Select>
      <Select v-model="roleFilter">
        <option value="">전체 권한</option>
        <option value="customer">customer</option>
        <option value="staff">staff</option>
        <option value="manager">manager</option>
        <option value="admin">admin</option>
        <option value="owner">owner</option>
      </Select>
      <Select v-model="adultFilter">
        <option value="">성인 인증 전체</option>
        <option value="verified">인증 완료</option>
        <option value="unverified">미인증</option>
      </Select>
    </section>

    <AdminTable :rows="filteredUsers" :columns="columns" row-key="uid">
      <template #isAdultVerified="{ row }">{{
        row.isAdultVerified ? "인증 완료" : "미인증"
      }}</template>
      <template #isGradeLocked="{ row }">{{
        row.isGradeLocked ? "고정" : "자동"
      }}</template>
      <template #availablePoint="{ row }">{{
        formatCurrency(row.availablePoint)
      }}</template>
      <template #actions="{ row }">
        <div class="row-actions">
          <Button size="sm" variant="ghost" :to="`/admin/members/${row.uid}`">
            상세 관리
          </Button>
        </div>
      </template>
    </AdminTable>
  </main>
</template>

<script setup lang="ts">
import { formatCurrency } from "~/utils/format";

definePageMeta({ layout: "admin", middleware: "admin" });
const users = useUserStore();
const productStore = useProductStore();
const keyword = ref("");
const gradeFilter = ref("");
const roleFilter = ref("");
const adultFilter = ref("");
const activeGrades = computed(() => {
  const grades = productStore.gradeBenefits
    .filter((grade) => grade.isVisible)
    .sort((a, b) => a.level - b.level || a.order - b.order);
  return grades.length
    ? grades
    : [{ gradeCode: "BASIC", label: "BASIC", level: 1, order: 1 }];
});
const filteredUsers = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  return users.users.filter((user) => {
    const haystack = [
      user.email,
      user.loginId,
      user.displayName,
      user.phoneNumber,
      user.uid,
    ]
      .join(" ")
      .toLowerCase();
    const matchesKeyword = !q || haystack.includes(q);
    const matchesGrade =
      !gradeFilter.value || user.userGrade === gradeFilter.value;
    const matchesRole = !roleFilter.value || user.role === roleFilter.value;
    const matchesAdult =
      !adultFilter.value ||
      (adultFilter.value === "verified" && user.isAdultVerified) ||
      (adultFilter.value === "unverified" && !user.isAdultVerified);

    return matchesKeyword && matchesGrade && matchesRole && matchesAdult;
  });
});
const columns = [
  { key: "email", label: "이메일" },
  { key: "loginId", label: "아이디" },
  { key: "displayName", label: "이름" },
  { key: "isAdultVerified", label: "성인 인증" },
  { key: "userGrade", label: "등급" },
  { key: "isGradeLocked", label: "등급 갱신" },
  { key: "role", label: "권한" },
  { key: "availablePoint", label: "포인트" },
] as const;

onMounted(async () => {
  await Promise.all([users.fetchUsers(true), productStore.fetchCatalog(true)]);
});

useHead({ title: "관리자 회원 관리" });
</script>

<style scoped>
.member-search {
  display: grid;
  grid-template-columns: minmax(240px, 1.5fr) repeat(3, minmax(150px, 1fr));
  gap: 10px;
  padding: 14px;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 860px) {
  .member-search {
    grid-template-columns: 1fr;
  }
}
</style>
