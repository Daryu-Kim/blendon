<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>회원 수동 등록</h1>
        <p>
          관리자가 확인한 회원 정보를 입력해 계정을 만들고 성인 인증을 수동
          확인 처리합니다.
        </p>
      </div>
      <Button to="/admin/members" variant="ghost">목록</Button>
    </div>

    <form class="member-create" @submit.prevent="submit">
      <AdminFormSection
        title="회원 정보"
        description="생성된 회원은 임시 비밀번호로 로그인한 뒤 비밀번호 변경 페이지로 안내됩니다."
      >
        <label>
          아이디
          <Input
            v-model="form.loginId"
            autocomplete="off"
            placeholder="영문/숫자 4자 이상"
            required
          />
        </label>
        <label>
          이메일
          <Input v-model="form.email" type="email" autocomplete="off" required />
        </label>
        <label>
          이름
          <Input v-model="form.displayName" autocomplete="off" required />
        </label>
        <label>
          휴대폰 번호
          <Input
            v-model="form.phoneNumber"
            inputmode="tel"
            placeholder="010-0000-0000"
            required
          />
        </label>
        <label>
          생년월일
          <Input
            v-model="form.birthDate"
            inputmode="numeric"
            placeholder="YYYY-MM-DD 또는 YYYYMMDD"
          />
        </label>
        <label>
          회원 등급
          <Select v-model="form.userGrade">
            <option
              v-for="grade in activeGrades"
              :key="grade.gradeCode"
              :value="grade.gradeCode"
            >
              {{ grade.label }} ({{ grade.gradeCode }})
            </option>
          </Select>
        </label>
        <label>
          권한
          <Select v-model="form.role">
            <option value="customer">customer</option>
            <option value="staff">staff</option>
            <option value="manager">manager</option>
            <option value="admin">admin</option>
            <option value="owner">owner</option>
          </Select>
        </label>
        <label class="wide">
          관리자 메모
          <Textarea
            v-model="form.adminMemo"
            placeholder="수동 성인 확인 근거, 응대 메모 등을 남겨 주세요."
          />
        </label>
      </AdminFormSection>

      <section v-if="createdResult" class="surface result-panel">
        <h2>회원 등록 완료</h2>
        <p>
          성인 인증은 관리자 수동 확인으로 처리했고, 최초 로그인 시 비밀번호
          변경 페이지로 안내됩니다.
        </p>
        <p :class="createdResult.sms.sent ? 'success' : 'warning'">
          {{
            createdResult.sms.sent
              ? "회원가입 안내 SMS를 발송했습니다."
              : createdResult.sms.message ||
                "SMS 발송 설정이 없어 수동 안내가 필요합니다."
          }}
        </p>
        <div v-if="createdResult.temporaryPassword" class="manual-message">
          <strong>임시 비밀번호</strong>
          <code>{{ createdResult.temporaryPassword }}</code>
          <p>{{ createdResult.manualSmsMessage }}</p>
        </div>
        <Button :to="`/admin/members/${createdResult.profile.uid}`">
          회원 상세 보기
        </Button>
      </section>

      <p v-if="error" class="error">{{ error }}</p>
      <div class="form-actions">
        <Button to="/admin/members" variant="ghost">취소</Button>
        <Button type="submit" :disabled="loading">
          {{ loading ? "등록 중" : "회원 등록" }}
        </Button>
      </div>
    </form>
  </main>
</template>

<script setup lang="ts">
import { toUserMessage } from "~/utils/error-message";
import type { GradeCode, Role, UserProfile } from "~/types/domain";

definePageMeta({ layout: "admin", middleware: "admin" });

const users = useUserStore();
const productStore = useProductStore();
const toast = useToast();
const form = reactive({
  loginId: "",
  email: "",
  displayName: "",
  phoneNumber: "",
  birthDate: "",
  userGrade: "BASIC" as GradeCode,
  role: "customer" as Role,
  adminMemo: "",
});
const loading = ref(false);
const error = ref("");
const createdResult = ref<{
  profile: UserProfile;
  temporaryPassword?: string;
  manualSmsMessage?: string;
  sms: {
    sent: boolean;
    status: string;
    message?: string;
  };
} | null>(null);

const activeGrades = computed(() => {
  const grades = productStore.gradeBenefits
    .filter((grade) => grade.isVisible)
    .sort((a, b) => a.level - b.level || a.order - b.order);
  return grades.length
    ? grades
    : [{ gradeCode: "BASIC", label: "BASIC", level: 1, order: 1 }];
});

watch(
  activeGrades,
  (grades) => {
    if (!grades.some((grade) => grade.gradeCode === form.userGrade)) {
      form.userGrade = grades[0]?.gradeCode || "BASIC";
    }
  },
  { immediate: true },
);

const submit = async () => {
  error.value = "";
  createdResult.value = null;
  loading.value = true;
  try {
    const result = await users.createMember({ ...form });
    createdResult.value = result;
    toast.show("회원을 등록했습니다.", "success");
    Object.assign(form, {
      loginId: "",
      email: "",
      displayName: "",
      phoneNumber: "",
      birthDate: "",
      userGrade: activeGrades.value[0]?.gradeCode || "BASIC",
      role: "customer",
      adminMemo: "",
    });
  } catch (e) {
    error.value = toUserMessage(e, "회원 등록에 실패했습니다.");
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await Promise.all([users.fetchUsers(), productStore.fetchCatalog(true)]);
});

useHead({ title: "회원 수동 등록" });
</script>

<style scoped>
.member-create {
  display: grid;
  gap: 16px;
}

label {
  display: grid;
  gap: 6px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.member-create :deep(.form-grid) {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.wide {
  grid-column: 1 / -1;
}

.result-panel {
  display: grid;
  gap: 12px;
  padding: 18px;
}

.result-panel h2,
.result-panel p {
  margin: 0;
}

.manual-message {
  display: grid;
  gap: 8px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fbf8f1;
  padding: 12px;
}

.manual-message code {
  width: fit-content;
  border-radius: 6px;
  background: #fff;
  padding: 6px 8px;
  font-weight: 900;
}

.success {
  color: var(--color-secondary-accent);
  font-weight: 900;
}

.warning,
.error {
  color: var(--color-warning);
  font-weight: 900;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 760px) {
  .member-create :deep(.form-grid) {
    grid-template-columns: 1fr;
  }
}
</style>
