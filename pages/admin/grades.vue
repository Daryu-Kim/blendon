<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>회원 등급 관리</h1>
        <p>등급별 할인율, 적립률, 무료배송 기준을 Firestore에서 관리합니다.</p>
      </div>
    </div>

    <div class="grade-list">
      <AdminFormSection
        v-for="benefit in benefits"
        :key="benefit.gradeCode"
        :title="benefit.label"
      >
        <div class="form-grid">
          <div class="form-row">
            <label>내부 코드</label><Input v-model="benefit.internalCode" />
          </div>
          <div class="form-row">
            <label>레벨</label><Input v-model="benefit.level" type="number" />
          </div>
          <div class="form-row">
            <label>할인율(%)</label
            ><Input
              v-model="benefit.discountRate"
              type="number"
              min="0"
              max="100"
            />
          </div>
          <div class="form-row">
            <label>적립률(%)</label
            ><Input
              v-model="benefit.pointRate"
              type="number"
              min="0"
              max="100"
            />
          </div>
          <div class="form-row">
            <label>승급 구매액</label
            ><Input v-model="benefit.minPurchaseAmount" type="number" min="0" />
          </div>
          <div class="form-row">
            <label>무료배송 기준</label
            ><Input
              v-model="benefit.freeShippingThreshold"
              type="number"
              min="0"
            />
          </div>
        </div>
        <div class="admin-actions">
          <Button @click="save(benefit)">저장</Button>
        </div>
      </AdminFormSection>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { GradeBenefit } from "~/types/domain";

definePageMeta({ layout: "admin", middleware: "admin" });

const productStore = useProductStore();
const benefits = ref<GradeBenefit[]>([]);

onMounted(async () => {
  await productStore.fetchCatalog();
  benefits.value = productStore.gradeBenefits.map((benefit) => ({
    ...benefit,
  }));
});

const save = async (benefit: GradeBenefit) => {
  await productStore.upsertGradeBenefit({
    ...benefit,
    level: Number(benefit.level),
    discountRate: Number(benefit.discountRate),
    pointRate: Number(benefit.pointRate),
    minPurchaseAmount: Number(benefit.minPurchaseAmount),
    freeShippingThreshold: Number(benefit.freeShippingThreshold),
  });
};

useHead({ title: "관리자 회원 등급 관리" });
</script>

<style scoped>
.grade-list {
  display: grid;
  gap: 16px;
}

.form-grid {
  display: grid;
  gap: 12px;
}

.admin-actions {
  display: flex;
  justify-content: flex-end;
}

@media (min-width: 900px) {
  .form-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
