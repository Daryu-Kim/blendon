<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>카테고리 관리</h1>
        <p>1차/2차/3차 카테고리, 노출 순서, 성인 전용 여부를 관리합니다.</p>
      </div>
    </div>

    <AdminFormSection title="카테고리 추가">
      <div class="form-row"><label>이름</label><Input v-model="name" /></div>
      <div class="form-row">
        <label>상위 카테고리</label
        ><Select v-model="parentId"
          ><option value="">없음</option>
          <option
            v-for="category in productStore.categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option></Select
        >
      </div>
      <div class="form-row">
        <label>성인 전용</label
        ><Select v-model="adultOnly"
          ><option value="false">아니오</option>
          <option value="true">예</option></Select
        >
      </div>
      <div class="form-row">
        <label>최소 열람 등급</label>
        <Select v-model="minUserGradeToView">
          <option
            v-for="grade in activeGrades"
            :key="grade.gradeCode"
            :value="grade.gradeCode"
          >
            {{ grade.label }} ({{ grade.gradeCode }})
          </option>
        </Select>
      </div>
      <Button @click="addCategory">추가</Button>
    </AdminFormSection>

    <AdminTable :rows="productStore.categories" :columns="columns" row-key="id">
      <template #parentId="{ row }">{{ row.parentId || "-" }}</template>
      <template #adultOnly="{ row }">{{
        row.adultOnly ? "예" : "아니오"
      }}</template>
    </AdminTable>
  </main>
</template>

<script setup lang="ts">
import { toSafeId } from "~/utils/format";

definePageMeta({ layout: "admin", middleware: "admin" });
const productStore = useProductStore();
const name = ref("");
const parentId = ref("");
const adultOnly = ref("false");
const minUserGradeToView = ref("BASIC");
const activeGrades = computed(() => {
  const grades = productStore.gradeBenefits
    .filter((grade) => grade.isVisible)
    .sort((a, b) => a.level - b.level || a.order - b.order);
  return grades.length
    ? grades
    : [{ gradeCode: "BASIC", label: "BASIC", level: 1, order: 1 }];
});
const columns = [
  { key: "name", label: "이름" },
  { key: "slug", label: "슬러그" },
  { key: "parentId", label: "상위" },
  { key: "depth", label: "깊이" },
  { key: "order", label: "순서" },
  { key: "adultOnly", label: "성인 전용" },
  { key: "minUserGradeToView", label: "최소 등급" },
] as const;

onMounted(async () => {
  await productStore.fetchCatalog();
});

const addCategory = async () => {
  if (!name.value) return;
  const parent = productStore.categories.find(
    (category) => category.id === parentId.value,
  );
  await productStore.upsertCategory({
    id: toSafeId(name.value),
    name: name.value,
    slug: toSafeId(name.value),
    parentId: parentId.value || null,
    depth: parent ? parent.depth + 1 : 1,
    order: productStore.categories.length + 1,
    isVisible: true,
    minUserGradeToView: minUserGradeToView.value,
    adultOnly: adultOnly.value === "true",
  });
  name.value = "";
};

useHead({ title: "관리자 카테고리 관리" });
</script>
