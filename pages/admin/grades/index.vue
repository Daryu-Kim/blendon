<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>회원 등급 관리</h1>
        <p>등급별 할인율, 적립률, 무료배송 기준을 관리합니다.</p>
      </div>
      <Button to="/admin/grades/new" variant="secondary">등급 추가</Button>
    </div>

    <AdminTable
      :rows="productStore.gradeBenefits"
      :columns="columns"
      row-key="id"
    >
      <template #isVisible="{ row }">{{
        row.isVisible ? "사용" : "숨김"
      }}</template>
      <template #discountRate="{ row }">{{ row.discountRate }}%</template>
      <template #pointRate="{ row }">{{ row.pointRate }}%</template>
      <template #minPurchaseAmount="{ row }">
        {{ formatCurrency(row.minPurchaseAmount) }}
      </template>
      <template #freeShippingThreshold="{ row }">
        {{
          row.freeShippingThreshold > 0
            ? formatCurrency(row.freeShippingThreshold)
            : "항상 무료배송"
        }}
      </template>
      <template #actions="{ row }">
        <div class="row-actions">
          <Button size="sm" variant="ghost" :to="`/admin/grades/${row.id}`">
            수정
          </Button>
          <Button size="sm" variant="danger" @click="remove(row.id)">
            삭제
          </Button>
        </div>
      </template>
    </AdminTable>
  </main>
</template>

<script setup lang="ts">
import { formatCurrency } from "~/utils/format";

definePageMeta({ layout: "admin", middleware: "admin" });

const productStore = useProductStore();
const columns = [
  { key: "gradeCode", label: "등급 코드" },
  { key: "label", label: "노출명" },
  { key: "internalCode", label: "내부 코드" },
  { key: "level", label: "레벨" },
  { key: "discountRate", label: "할인율" },
  { key: "pointRate", label: "적립률" },
  { key: "minPurchaseAmount", label: "승급 기준" },
  { key: "freeShippingThreshold", label: "무료배송 기준" },
  { key: "isVisible", label: "상태" },
] as const;

const remove = async (id: string) => {
  if (!confirm("회원 등급을 삭제할까요?")) return;
  await productStore.removeGradeBenefit(id);
};

onMounted(async () => {
  await productStore.fetchCatalog(true);
});

useHead({ title: "관리자 회원 등급 관리" });
</script>

<style scoped>
.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
