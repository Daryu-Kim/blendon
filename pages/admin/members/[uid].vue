<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>회원 상세 관리</h1>
        <p>회원 정보, 등급 고정, 포인트, 관리자 메모를 관리합니다.</p>
      </div>
      <Button to="/admin/members" variant="ghost">목록</Button>
    </div>

    <EmptyState
      v-if="!member"
      title="회원을 찾을 수 없어요."
      description="회원 목록에서 다시 선택해 주세요."
      action-label="회원 목록"
      action-to="/admin/members"
    />

    <div v-else class="member-detail">
      <AdminFormSection title="기본 정보">
        <div class="field">
          <span>UID</span>
          <strong>{{ member.uid }}</strong>
        </div>
        <div class="field">
          <span>아이디</span>
          <strong>{{ member.loginId }}</strong>
        </div>
        <div class="field">
          <span>이메일</span>
          <strong>{{ member.email }}</strong>
        </div>
        <div class="field">
          <span>이름</span>
          <strong>{{ member.displayName }}</strong>
        </div>
        <div class="field">
          <span>휴대폰</span>
          <strong>{{ member.phoneNumber || "-" }}</strong>
        </div>
        <div class="field">
          <span>생년월일</span>
          <strong>{{ member.birthDate || "-" }}</strong>
        </div>
        <div class="field">
          <span>성인 인증</span>
          <strong>{{ member.isAdultVerified ? "인증 완료" : "미인증" }}</strong>
        </div>
        <div class="field">
          <span>가입일</span>
          <strong>{{ formatDate(member.createdAt) }}</strong>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="등급 및 권한"
        description="등급 고정을 켜면 매월 1일 자동 등급 갱신 대상에서 제외됩니다."
      >
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
        <label>
          등급 자동 갱신
          <Select v-model="gradeLockText">
            <option value="false">자동 갱신</option>
            <option value="true">현재 등급으로 고정</option>
          </Select>
        </label>
        <label class="wide">
          등급 고정 사유
          <Textarea
            v-model="form.gradeLockReason"
            placeholder="VIP 응대, 제휴 회원, 운영자 수동 조정 등"
          />
        </label>
        <div class="field">
          <span>최근 6개월 구매확정액</span>
          <strong>{{ formatCurrency(member.gradePurchaseAmount6Months || 0) }}</strong>
        </div>
        <div class="field">
          <span>마지막 등급 평가</span>
          <strong>{{ member.gradeEvaluatedAt ? formatDate(member.gradeEvaluatedAt) : "-" }}</strong>
        </div>
      </AdminFormSection>

      <AdminFormSection title="포인트 및 메모">
        <div class="point-balance">
          <span>현재 보유 포인트</span>
          <strong>{{ formatCurrency(member.availablePoint || 0) }}</strong>
        </div>
        <div class="point-adjust">
          <label>
            지급/차감 포인트
            <Input
              v-model="pointAdjust.amount"
              inputmode="numeric"
              placeholder="예: 1000 또는 -1000"
            />
          </label>
          <label class="wide">
            처리 사유
            <Textarea
              v-model="pointAdjust.memo"
              placeholder="CS 보상 지급, 오지급 회수, 프로모션 지급 등"
            />
          </label>
          <Button type="button" variant="secondary" @click="adjustPoint">
            포인트 처리
          </Button>
        </div>
        <label class="wide">
          관리자 메모
          <Textarea
            v-model="form.adminMemo"
            placeholder="상담 이력, 운영 참고사항을 입력하세요."
          />
        </label>
      </AdminFormSection>

      <AdminFormSection title="포인트 내역">
        <div v-if="pointLogs.length" class="point-log-list">
          <div v-for="log in pointLogs" :key="log.id" class="point-log">
            <div>
              <strong :class="log.amount > 0 ? 'is-plus' : 'is-minus'">
                {{ log.amount > 0 ? "+" : "" }}{{ formatCurrency(log.amount) }}
              </strong>
              <span>{{ pointReasonLabel(log.reason) }}</span>
              <p>{{ log.memo || "-" }}</p>
            </div>
            <div class="point-log-meta">
              <span>{{ formatDate(log.createdAt) }}</span>
              <span>잔액 {{ formatCurrency(log.balanceAfter) }}</span>
              <span v-if="log.orderNo">주문 {{ log.orderNo }}</span>
            </div>
          </div>
        </div>
        <EmptyState
          v-else
          title="포인트 내역이 없어요."
          description="주문 적립, 사용, 관리자 지급/차감 내역이 이곳에 기록됩니다."
        />
      </AdminFormSection>

      <AdminFormSection
        title="계정 보안"
        description="Firebase Auth 템플릿을 사용해 비밀번호 재설정 메일을 발송합니다."
      >
        <div class="security-actions">
          <Button variant="secondary" @click="sendResetEmail">
            비밀번호 재설정 링크 발송
          </Button>
        </div>
      </AdminFormSection>

      <div class="form-actions">
        <Button variant="ghost" to="/admin/members">취소</Button>
        <Button @click="save">저장</Button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate } from "~/utils/format";
import type { GradeCode, PointLogReason, Role } from "~/types/domain";

definePageMeta({ layout: "admin", middleware: "admin" });

const route = useRoute();
const toast = useToast();
const users = useUserStore();
const productStore = useProductStore();
const uid = computed(() => String(route.params.uid));
const member = computed(() => users.users.find((user) => user.uid === uid.value) || null);

const activeGrades = computed(() => {
  const grades = productStore.gradeBenefits
    .filter((grade) => grade.isVisible)
    .sort((a, b) => a.level - b.level || a.order - b.order);
  return grades.length
    ? grades
    : [{ gradeCode: "BASIC", label: "BASIC", level: 1, order: 1 }];
});

const form = reactive({
  userGrade: "BASIC" as GradeCode,
  role: "customer" as Role,
  isGradeLocked: false,
  gradeLockReason: "",
  adminMemo: "",
});
const pointAdjust = reactive({
  amount: "",
  memo: "",
});
const pointLogs = computed(() => users.pointLogsByUser[uid.value] || []);

const gradeLockText = computed({
  get: () => String(form.isGradeLocked),
  set: (value: string) => {
    form.isGradeLocked = value === "true";
  },
});

const syncForm = () => {
  if (!member.value) return;
  form.userGrade = member.value.userGrade;
  form.role = member.value.role;
  form.isGradeLocked = Boolean(member.value.isGradeLocked);
  form.gradeLockReason = member.value.gradeLockReason || "";
  form.adminMemo = member.value.adminMemo || "";
};

watch(member, syncForm, { immediate: true });

const save = async () => {
  if (!member.value) return;
  const grade = productStore.findGradeBenefit(form.userGrade);
  await users.patchUser(member.value.uid, {
    userGrade: form.userGrade,
    userGradeLevel: grade?.level || 1,
    role: form.role,
    isGradeLocked: form.isGradeLocked,
    gradeLockedAt: form.isGradeLocked
      ? member.value.gradeLockedAt || new Date().toISOString()
      : null,
    gradeLockedBy: form.isGradeLocked ? useAuthStore().profile?.uid || null : null,
    gradeLockReason: form.isGradeLocked ? form.gradeLockReason : "",
    adminMemo: form.adminMemo,
  });
  toast.show("회원 정보를 저장했습니다.", "success");
};

const adjustPoint = async () => {
  if (!member.value) return;
  await users.adjustUserPoint(
    member.value.uid,
    Number(pointAdjust.amount || 0),
    pointAdjust.memo,
  );
  pointAdjust.amount = "";
  pointAdjust.memo = "";
  await users.fetchPointLogs(member.value.uid, true);
  toast.show("포인트 처리가 완료되었습니다.", "success");
};

const sendResetEmail = async () => {
  if (!member.value) return;
  await users.sendPasswordResetEmail(member.value.uid);
  toast.show("비밀번호 재설정 메일을 발송했습니다.", "success");
};

onMounted(async () => {
  await Promise.all([
    users.fetchUsers(),
    users.fetchUser(uid.value),
    users.fetchPointLogs(uid.value, true),
    productStore.fetchCatalog(true),
  ]);
  syncForm();
});

useHead(() => ({
  title: member.value
    ? `회원 상세 관리 - ${member.value.displayName || member.value.email}`
    : "회원 상세 관리",
}));

const pointReasonLabel = (reason: PointLogReason) =>
  ({
    "order-earned": "주문 적립",
    "order-used": "주문 사용",
    "admin-grant": "관리자 지급",
    "admin-deduct": "관리자 차감",
    "order-cancel": "주문 취소",
    expired: "소멸",
    migration: "마이그레이션",
    other: "기타",
  })[reason] || "기타";
</script>

<style scoped>
.member-detail {
  display: grid;
  gap: 16px;
}

.field {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.field span,
label {
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.field strong {
  overflow-wrap: anywhere;
}

.point-balance {
  display: grid;
  gap: 6px;
}

.point-balance span {
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.point-balance strong {
  font-size: 24px;
}

.point-adjust {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: minmax(180px, 0.7fr) minmax(260px, 1.3fr) auto;
  gap: 10px;
  align-items: end;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  padding: 14px;
}

.point-log-list {
  display: grid;
  grid-column: 1 / -1;
  gap: 10px;
}

.point-log {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid var(--color-line);
  padding: 12px 0;
}

.point-log strong {
  display: inline-flex;
  min-width: 96px;
}

.point-log p {
  margin: 6px 0 0;
  color: var(--color-muted);
}

.point-log-meta {
  display: grid;
  gap: 4px;
  color: var(--color-muted);
  font-size: 13px;
  text-align: right;
  white-space: nowrap;
}

.is-plus {
  color: var(--color-secondary-accent);
}

.is-minus {
  color: var(--color-warning);
}

.wide {
  grid-column: 1 / -1;
}

.security-actions,
.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.form-actions {
  justify-content: flex-end;
}

@media (max-width: 760px) {
  .point-adjust,
  .point-log {
    grid-template-columns: 1fr;
  }

  .point-log {
    display: grid;
  }

  .point-log-meta {
    text-align: left;
    white-space: normal;
  }
}
</style>
