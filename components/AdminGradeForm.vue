<template>
  <form class="grade-form" @submit.prevent="submit">
    <AdminFormSection
      title="등급 기본 정보"
      description="새 등급을 생성하고 회원에게 노출되는 이름과 내부 운영 코드를 설정합니다."
    >
      <div class="form-grid">
        <div class="form-row">
          <label>등급 코드</label>
          <Input
            v-model="form.gradeCode"
            :disabled="Boolean(grade)"
            placeholder="예: BASIC, SILVER, VIP_2026"
            required
          />
        </div>
        <div class="form-row">
          <label>노출명</label>
          <Input v-model="form.label" required />
        </div>
        <div class="form-row">
          <label>내부 코드</label>
          <Input v-model="form.internalCode" placeholder="G1" required />
        </div>
        <div class="form-row">
          <label>레벨</label>
          <Input v-model="form.level" type="number" min="1" required />
        </div>
        <div class="form-row">
          <label>노출 순서</label>
          <Input v-model="form.order" type="number" min="0" required />
        </div>
        <div class="form-row">
          <label>사용 여부</label>
          <Select v-model="visibleText">
            <option value="true">사용</option>
            <option value="false">숨김</option>
          </Select>
        </div>
      </div>
    </AdminFormSection>

    <AdminFormSection
      title="혜택"
      description="상품 고정 등급가가 없는 경우 회원가에 할인율을 적용합니다. 무료배송 기준을 0으로 두면 조건 없이 무료배송됩니다."
    >
      <div class="form-grid">
        <div class="form-row">
          <label>할인율(%)</label>
          <Input v-model="form.discountRate" type="number" min="0" max="100" />
        </div>
        <div class="form-row">
          <label>적립률(%)</label>
          <Input v-model="form.pointRate" type="number" min="0" max="100" />
        </div>
        <div class="form-row">
          <label>승급 기준 구매액</label>
          <Input v-model="form.minPurchaseAmount" type="number" min="0" />
        </div>
        <div class="form-row">
          <label>무료배송 기준</label>
          <Input v-model="form.freeShippingThreshold" type="number" min="0" />
        </div>
      </div>
    </AdminFormSection>

    <div class="sticky-actions">
      <Button type="button" variant="ghost" to="/admin/grades">목록</Button>
      <Button type="submit">저장</Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { GradeBenefit } from "~/types/domain";
import { toSafeId } from "~/utils/format";

const props = defineProps<{ grade?: GradeBenefit | null }>();
const emit = defineEmits<{ saved: [grade: GradeBenefit] }>();

const productStore = useProductStore();
const now = new Date().toISOString();

const createEmptyGrade = (): GradeBenefit => ({
  id: "",
  gradeCode: "",
  internalCode: "G1",
  level: 1,
  label: "",
  discountRate: 0,
  pointRate: 1,
  minPurchaseAmount: 0,
  freeShippingThreshold: 50000,
  isVisible: true,
  order: productStore.gradeBenefits.length + 1,
  createdAt: now,
  updatedAt: now,
});

const form = reactive<GradeBenefit>(
  props.grade
    ? JSON.parse(JSON.stringify(props.grade))
    : createEmptyGrade(),
);

const visibleText = computed({
  get: () => String(form.isVisible),
  set: (value) => {
    form.isVisible = value === "true";
  },
});

const submit = async () => {
  const gradeCode = form.gradeCode.trim().toUpperCase();
  const id = form.id || gradeCode || toSafeId(form.label);
  const grade: GradeBenefit = {
    ...form,
    id,
    gradeCode: gradeCode || id,
    label: form.label.trim() || gradeCode || id,
    internalCode: form.internalCode.trim(),
    level: Number(form.level || 1),
    discountRate: Number(form.discountRate || 0),
    pointRate: Number(form.pointRate || 0),
    minPurchaseAmount: Number(form.minPurchaseAmount || 0),
    freeShippingThreshold: Number(form.freeShippingThreshold || 0),
    order: Number(form.order || 0),
    createdAt: form.createdAt || now,
    updatedAt: new Date().toISOString(),
  };
  await productStore.upsertGradeBenefit(grade);
  emit("saved", grade);
};
</script>

<style scoped>
.grade-form {
  display: grid;
  gap: 18px;
}

.form-grid {
  display: grid;
  gap: 14px;
}

.sticky-actions {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid var(--color-line);
  background: rgba(247, 243, 234, 0.92);
  padding: 14px 0;
  backdrop-filter: blur(14px);
}

@media (min-width: 860px) {
  .form-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
