<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>카테고리 관리</h1>
        <p>1차/2차/3차 카테고리를 트리 구조로 확인하고 권한 정책을 관리합니다.</p>
      </div>
      <Button to="/admin/categories/new" variant="secondary">카테고리 추가</Button>
    </div>

    <section class="surface category-summary">
      <div>
        <span>전체</span>
        <strong>{{ productStore.categories.length }}</strong>
      </div>
      <div>
        <span>노출</span>
        <strong>{{ visibleCount }}</strong>
      </div>
      <div>
        <span>성인 전용</span>
        <strong>{{ adultOnlyCount }}</strong>
      </div>
      <div>
        <span>등급 제한</span>
        <strong>{{ restrictedCount }}</strong>
      </div>
    </section>

    <AdminTable :rows="treeRows" :columns="columns" row-key="id">
      <template #treeName="{ row }">
        <div class="tree-cell" :style="{ '--depth': row.depth - 1 }">
          <span class="tree-branch" aria-hidden="true">{{ row.branch }}</span>
          <strong>{{ row.name }}</strong>
          <span v-if="row.depth > 1" class="depth-chip">{{ row.depth }}차</span>
        </div>
      </template>
      <template #parentName="{ row }">{{ row.parentName }}</template>
      <template #isVisible="{ row }">
        <span :class="['status-pill', row.isVisible ? 'active' : 'muted']">
          {{ row.isVisible ? "노출" : "숨김" }}
        </span>
      </template>
      <template #adultOnly="{ row }">{{ row.adultOnly ? "예" : "아니오" }}</template>
      <template #minUserGradeToView="{ row }">
        {{ gradeLabel(row.minUserGradeToView, row.minUserGradeLevel) }}
      </template>
      <template #displayMinUserGradeToView="{ row }">
        {{
          gradeLabel(
            row.displayMinUserGradeToView || "PUBLIC",
            row.displayMinUserGradeLevel,
          )
        }}
      </template>
      <template #actions="{ row }">
        <div class="row-actions">
          <Button size="sm" variant="ghost" :to="`/admin/categories/${row.id}`"
            >수정</Button
          >
          <Button size="sm" variant="danger" @click="remove(row.id)"
            >삭제</Button
          >
        </div>
      </template>
    </AdminTable>
  </main>
</template>

<script setup lang="ts">
import type { Category } from "~/types/domain";
import { buildCategoryTree } from "~/utils/category-tree";
import { PUBLIC_ACCESS_GRADE } from "~/utils/access";

definePageMeta({ layout: "admin", middleware: "admin" });

type CategoryTreeRow = Category & {
  treeName: string;
  branch: string;
  parentName: string;
};

const productStore = useProductStore();

const columns = [
  { key: "treeName", label: "카테고리" },
  { key: "slug", label: "슬러그" },
  { key: "parentName", label: "상위" },
  { key: "order", label: "순서" },
  { key: "isVisible", label: "노출" },
  { key: "adultOnly", label: "성인 전용" },
  { key: "displayMinUserGradeToView", label: "표시 등급" },
  { key: "minUserGradeToView", label: "열람 등급" },
] as const;

const categoryNameMap = computed(() =>
  new Map(productStore.categories.map((category) => [category.id, category.name])),
);

const treeRows = computed<CategoryTreeRow[]>(() =>
  buildCategoryTree(productStore.categories).map((category) => ({
    ...category,
    treeName: category.name,
    branch: category.depth > 1 ? `${"│ ".repeat(category.depth - 2)}└` : "",
    parentName: category.parentId
      ? categoryNameMap.value.get(category.parentId) || category.parentId
      : "-",
  })),
);

const visibleCount = computed(
  () => productStore.categories.filter((category) => category.isVisible).length,
);
const adultOnlyCount = computed(
  () => productStore.categories.filter((category) => category.adultOnly).length,
);
const restrictedCount = computed(
  () =>
    productStore.categories.filter(
      (category) => category.minUserGradeToView !== PUBLIC_ACCESS_GRADE,
    ).length,
);

const gradeLabel = (gradeCode: string, level?: number) => {
  if (gradeCode === PUBLIC_ACCESS_GRADE) return "전체 공개";
  const grade = productStore.findGradeBenefit(gradeCode);
  if (grade && (!level || grade.level === level)) {
    return `${grade.label} 이상 (level ${grade.level})`;
  }
  if (level && level > 0) return `레벨 ${level} 이상`;
  const matched = /^(?:G|LEVEL_)(\d+)$/.exec(gradeCode);
  return matched ? `레벨 ${matched[1]} 이상` : `${gradeCode} 이상`;
};

const remove = async (id: string) => {
  if (!confirm("카테고리를 삭제할까요? 연결된 상품의 categoryIds는 직접 정리해야 합니다."))
    return;
  await productStore.removeCategory(id);
};

onMounted(async () => {
  await productStore.fetchCatalog(true);
});

useHead({ title: "관리자 카테고리 관리" });
</script>

<style scoped>
.category-summary {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
  padding: 14px;
}

.category-summary div {
  display: grid;
  gap: 4px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  padding: 12px;
}

.category-summary span {
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.category-summary strong {
  font-size: 22px;
}

.tree-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: calc(var(--depth) * 22px);
}

.tree-branch {
  color: var(--color-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.depth-chip,
.status-pill {
  display: inline-flex;
  min-height: 24px;
  align-items: center;
  border-radius: 999px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 900;
}

.depth-chip {
  background: #f4eee2;
  color: #725420;
}

.status-pill.active {
  background: #edf5ef;
  color: #426b52;
}

.status-pill.muted {
  background: #f2f2f2;
  color: #777;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (min-width: 860px) {
  .category-summary {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
