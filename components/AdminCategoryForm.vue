<template>
  <form class="category-form" @submit.prevent="submit">
    <AdminFormSection
      title="카테고리 기본 정보"
      description="상위 카테고리와 노출 순서에 따라 관리자 목록과 소비자 메뉴 구조가 정렬됩니다."
    >
      <div class="form-grid">
        <div class="form-row">
          <label>이름</label>
          <Input v-model="form.name" required />
        </div>
        <div class="form-row">
          <label>슬러그</label>
          <Input
            v-model="form.slug"
            placeholder="비워두면 이름 기준 자동 생성"
          />
        </div>
        <div class="form-row">
          <label>상위 카테고리</label>
          <Select v-model="parentId">
            <option value="">없음</option>
            <option
              v-for="option in parentOptions"
              :key="option.id"
              :value="option.id"
            >
              {{ option.treeName }}
            </option>
          </Select>
        </div>
        <div class="form-row">
          <label>노출 순서</label>
          <Input v-model="form.order" type="number" min="0" />
        </div>
        <div class="form-row">
          <label>노출 여부</label>
          <Select v-model="isVisibleText">
            <option value="true">노출</option>
            <option value="false">숨김</option>
          </Select>
        </div>
      </div>
    </AdminFormSection>

    <AdminFormSection
      title="접근 권한"
      description="최소 열람 등급 이상인 회원에게만 카테고리와 연결 상품이 노출됩니다."
    >
      <div class="form-grid">
        <div class="form-row">
          <label>성인 전용</label>
          <Select v-model="adultOnlyText">
            <option value="false">아니오</option>
            <option value="true">예</option>
          </Select>
        </div>
        <div class="form-row">
          <label>최소 열람 등급</label>
          <Select v-model="minViewAccessValue">
            <option
              v-for="grade in accessGradeOptions"
              :key="grade.value"
              :value="grade.value"
            >
              {{ grade.label }}
            </option>
          </Select>
        </div>
        <div class="form-row">
          <label>표시 최소 등급</label>
          <Select v-model="displayAccessValue">
            <option
              v-for="grade in accessGradeOptions"
              :key="grade.value"
              :value="grade.value"
            >
              {{ grade.label }}
            </option>
          </Select>
        </div>
      </div>
    </AdminFormSection>

    <div class="sticky-actions">
      <Button type="button" variant="ghost" to="/admin/categories">목록</Button>
      <Button type="submit">저장</Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { AccessGradeCode, Category, GradeBenefit } from "~/types/domain";
import { buildCategoryTree } from "~/utils/category-tree";
import { toSafeId } from "~/utils/format";
import { gradeLevel, PUBLIC_ACCESS_GRADE } from "~/utils/access";

const props = defineProps<{ category?: Category | null }>();
const emit = defineEmits<{ saved: [category: Category] }>();

const productStore = useProductStore();

const createEmptyCategory = (): Category => ({
  id: "",
  name: "",
  slug: "",
  parentId: null,
  depth: 1,
  order: productStore.categories.length + 1,
  isVisible: true,
  minUserGradeToView: PUBLIC_ACCESS_GRADE,
  minUserGradeLevel: 0,
  displayMinUserGradeToView: PUBLIC_ACCESS_GRADE,
  displayMinUserGradeLevel: 0,
  adultOnly: true,
});

const form = reactive<Category>(
  props.category
    ? JSON.parse(JSON.stringify(props.category))
    : createEmptyCategory(),
);

const parentId = computed({
  get: () => form.parentId || "",
  set: (value) => {
    form.parentId = value || null;
  },
});

const isVisibleText = computed({
  get: () => String(form.isVisible),
  set: (value) => {
    form.isVisible = value === "true";
  },
});

const adultOnlyText = computed({
  get: () => String(form.adultOnly),
  set: (value) => {
    form.adultOnly = value === "true";
  },
});

const activeGrades = computed(() => {
  const grades = productStore.gradeBenefits
    .filter((grade) => grade.isVisible)
    .sort((a, b) => a.level - b.level || a.order - b.order);
  return grades.length
    ? grades
    : ([
        {
          id: "BASIC",
          gradeCode: "BASIC",
          internalCode: "G1",
          level: 1,
          label: "BASIC",
          discountRate: 0,
          pointRate: 0,
          minPurchaseAmount: 0,
          freeShippingThreshold: 0,
          isVisible: true,
          order: 1,
          createdAt: new Date(0).toISOString(),
          updatedAt: new Date(0).toISOString(),
        },
      ] satisfies GradeBenefit[]);
});
const accessGradeOptions = computed(() => {
  const options = [
    { value: PUBLIC_ACCESS_GRADE, label: "전체 공개", level: 0, order: 0 },
    ...activeGrades.value.map((grade) => ({
      ...grade,
      value: `GRADE:${grade.gradeCode}`,
      label: `${grade.label} 이상 (level ${grade.level}, ${grade.internalCode || grade.gradeCode})`,
    })),
  ];
  return [...new Map(options.map((option) => [option.value, option])).values()]
    .sort((a, b) => a.level - b.level || a.order - b.order);
});

const gradeByCode = (gradeCode?: string) =>
  productStore.gradeBenefits.find(
    (grade) =>
      grade.gradeCode === gradeCode ||
      grade.id === gradeCode ||
      grade.internalCode === gradeCode,
  );

const accessValueFrom = (gradeCode?: string, level?: number) => {
  if (!gradeCode || gradeCode === PUBLIC_ACCESS_GRADE) return PUBLIC_ACCESS_GRADE;
  const grade = gradeByCode(gradeCode);
  if (grade && (!level || grade.level === level)) return `GRADE:${grade.gradeCode}`;
  const levelGrade = productStore.gradeBenefits.find(
    (item) => item.isVisible && item.level === level,
  );
  if (levelGrade) return `GRADE:${levelGrade.gradeCode}`;
  return grade ? `GRADE:${grade.gradeCode}` : gradeCode;
};

const applyAccessValue = (value: string, target: "view" | "display") => {
  let gradeCode: AccessGradeCode = PUBLIC_ACCESS_GRADE;
  let level = 0;

  if (value.startsWith("GRADE:")) {
    const grade = gradeByCode(value.replace(/^GRADE:/, ""));
    gradeCode = grade?.gradeCode || PUBLIC_ACCESS_GRADE;
    level = grade?.level || 0;
  }

  if (target === "view") {
    form.minUserGradeToView = gradeCode;
    form.minUserGradeLevel = level;
  } else {
    form.displayMinUserGradeToView = gradeCode;
    form.displayMinUserGradeLevel = level;
  }
};

const minViewAccessValue = computed({
  get: () => accessValueFrom(form.minUserGradeToView, form.minUserGradeLevel),
  set: (value: string) => applyAccessValue(value, "view"),
});

const displayAccessValue = computed({
  get: () =>
    accessValueFrom(
      form.displayMinUserGradeToView,
      form.displayMinUserGradeLevel,
    ),
  set: (value: string) => applyAccessValue(value, "display"),
});

const sortedCategories = computed(() => buildCategoryTree(productStore.categories));
const descendantIds = computed(() => {
  if (!form.id) return new Set<string>();
  const result = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    productStore.categories.forEach((category) => {
      if (
        category.parentId &&
        (category.parentId === form.id || result.has(category.parentId)) &&
        !result.has(category.id)
      ) {
        result.add(category.id);
        changed = true;
      }
    });
  }
  return result;
});

const parentOptions = computed(() =>
  sortedCategories.value
    .filter(
      (category) =>
        category.id !== form.id &&
        !descendantIds.value.has(category.id) &&
        category.depth < 4,
    )
    .map((category) => ({
      ...category,
      treeName: `${"— ".repeat(Math.max(0, category.depth - 1))}${category.name}`,
    })),
);

const submit = async () => {
  if (!form.name.trim()) return;
  const parent = productStore.categories.find(
    (category) => category.id === form.parentId,
  );
  const id = form.id || toSafeId(form.name);
  const displayGradeCode =
    form.displayMinUserGradeToView || form.minUserGradeToView;
  const category: Category = {
    ...form,
    id,
    name: form.name.trim(),
    slug: form.slug.trim() || toSafeId(form.name),
    parentId: form.parentId || null,
    depth: parent ? parent.depth + 1 : 1,
    order: Number(form.order || productStore.categories.length + 1),
    minUserGradeLevel:
      form.minUserGradeToView === PUBLIC_ACCESS_GRADE
        ? 0
        : Number(form.minUserGradeLevel || 0) ||
          gradeLevel(form.minUserGradeToView, productStore.gradeBenefits) ||
          1,
    displayMinUserGradeToView: displayGradeCode,
    displayMinUserGradeLevel:
      displayGradeCode === PUBLIC_ACCESS_GRADE
        ? 0
        : Number(form.displayMinUserGradeLevel || 0) ||
          gradeLevel(displayGradeCode, productStore.gradeBenefits) ||
          1,
  };
  await productStore.upsertCategory(category);
  emit("saved", category);
};
</script>

<style scoped>
.category-form {
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
