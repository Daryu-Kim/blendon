<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>상품 관리</h1>
        <p>상품을 검색하고 노출, 재고, 권한 상태를 빠르게 확인합니다.</p>
      </div>
      <Button to="/admin/products/new" variant="secondary">상품 추가</Button>
    </div>

    <section class="surface product-search">
      <Input v-model="keyword" placeholder="상품명, 브랜드, 태그 검색" />
      <Select v-model="status">
        <option value="">전체 상태</option>
        <option value="draft">임시저장</option>
        <option value="active">판매중</option>
        <option value="hidden">숨김</option>
        <option value="soldOut">품절</option>
        <option value="deleted">삭제</option>
      </Select>
      <Select v-model="categoryId">
        <option value="">전체 카테고리</option>
        <option
          v-for="category in productStore.categories"
          :key="category.id"
          :value="category.id"
        >
          {{ category.name }}
        </option>
      </Select>
    </section>

    <AdminTable :rows="filteredProducts" :columns="columns" row-key="id">
      <template #thumbnailUrl="{ row }">
        <img class="thumb" :src="row.thumbnailUrl" :alt="row.name" />
      </template>
      <template #memberPrice="{ row }">{{
        formatCurrency(row.memberPrice)
      }}</template>
      <template #stock="{ row }"
        ><span :class="{ danger: row.stock <= 10 }">{{
          row.stock
        }}</span></template
      >
      <template #isVisible="{ row }">{{
        row.isVisible ? "노출" : "숨김"
      }}</template>
      <template #minUserGradeToView="{ row }">
        <span
          >{{ row.isAdultOnly ? "성인" : "일반" }} /
          {{ gradeLabel(row.minUserGradeToView) }}</span
        >
      </template>
      <template #actions="{ row }">
        <div class="row-actions">
          <Button size="sm" variant="ghost" :to="`/admin/products/${row.id}`"
            >수정</Button
          >
          <Button
            size="sm"
            variant="ghost"
            @click="productStore.toggleVisibility(row.id)"
            >노출전환</Button
          >
          <Button size="sm" variant="ghost" @click="openCloneModal(row)"
            >복제</Button
          >
          <Button
            size="sm"
            variant="danger"
            @click="productStore.softDeleteProduct(row.id)"
            >삭제</Button
          >
        </div>
      </template>
    </AdminTable>

    <Modal :open="cloneModalOpen" title="상품 복제" @close="closeCloneModal">
      <form class="clone-form" @submit.prevent="submitClone">
        <p v-if="cloneSource" class="clone-summary">
          <span>원본 상품</span>
          <strong>{{ cloneSource.name }}</strong>
          <code>{{ cloneSource.id }}</code>
        </p>

        <label class="clone-row">
          새 상품 문서 ID
          <Input
            v-model="cloneProductId"
            :placeholder="cloneSource?.id || '복제할 상품의 id'"
            autocomplete="off"
            required
          />
        </label>
        <p class="field-help">
          문서 ID를 입력해야 복제할 수 있습니다. 복제본은 임시저장/숨김
          상태로 생성됩니다.
        </p>
        <p v-if="cloneError" class="clone-error">{{ cloneError }}</p>

        <div class="clone-actions">
          <Button type="button" variant="ghost" @click="closeCloneModal">
            취소
          </Button>
          <Button type="submit" :disabled="!canSubmitClone">
            {{ cloning ? "복제 중" : "복제" }}
          </Button>
        </div>
      </form>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import type { Product } from "~/types/domain";
import { formatCurrency } from "~/utils/format";
import { PUBLIC_ACCESS_GRADE } from "~/utils/access";
import { toUserMessage } from "~/utils/error-message";

definePageMeta({ layout: "admin", middleware: "admin" });

const productStore = useProductStore();
const keyword = ref("");
const status = ref("");
const categoryId = ref("");
const toast = useToast();
const cloneModalOpen = ref(false);
const cloneSource = ref<Product | null>(null);
const cloneProductId = ref("");
const cloneError = ref("");
const cloning = ref(false);

const columns = [
  { key: "thumbnailUrl", label: "이미지" },
  { key: "name", label: "상품명" },
  { key: "memberPrice", label: "회원가" },
  { key: "stock", label: "재고" },
  { key: "isVisible", label: "노출" },
  { key: "status", label: "상태" },
  { key: "minUserGradeToView", label: "권한" },
] as const;

const filteredProducts = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  return productStore.products.filter((product) => {
    const matchesKeyword =
      !q ||
      product.name.toLowerCase().includes(q) ||
      product.brandName.toLowerCase().includes(q) ||
      product.tags.some((tag) => tag.toLowerCase().includes(q));
    const matchesStatus = !status.value || product.status === status.value;
    const matchesCategory =
      !categoryId.value || product.categoryIds.includes(categoryId.value);
    return matchesKeyword && matchesStatus && matchesCategory;
  });
});

const gradeLabel = (gradeCode: string) => {
  if (gradeCode === PUBLIC_ACCESS_GRADE) return "전체 공개";
  const grade = productStore.findGradeBenefit(gradeCode);
  return grade ? `${grade.label} 이상` : `${gradeCode} 이상`;
};

const normalizedCloneProductId = computed(() => cloneProductId.value.trim());
const canSubmitClone = computed(
  () => Boolean(normalizedCloneProductId.value) && !cloning.value,
);

const openCloneModal = (product: Product) => {
  cloneSource.value = product;
  cloneProductId.value = "";
  cloneError.value = "";
  cloneModalOpen.value = true;
};

const closeCloneModal = () => {
  if (cloning.value) return;
  cloneModalOpen.value = false;
  cloneSource.value = null;
  cloneProductId.value = "";
  cloneError.value = "";
};

const submitClone = async () => {
  if (!cloneSource.value || !normalizedCloneProductId.value) {
    cloneError.value = "복제 상품의 문서 ID를 입력해 주세요.";
    return;
  }

  cloning.value = true;
  cloneError.value = "";

  try {
    const cloned = await productStore.duplicateProduct(
      cloneSource.value.id,
      normalizedCloneProductId.value,
    );
    toast.show("상품을 복제했습니다.", "success");
    cloneModalOpen.value = false;
    await navigateTo(`/admin/products/${encodeURIComponent(cloned.id)}`);
  } catch (error) {
    cloneError.value = toUserMessage(error, "상품 복제에 실패했습니다.");
  } finally {
    cloning.value = false;
  }
};

onMounted(async () => {
  await productStore.fetchCatalog();
});

useHead({ title: "관리자 상품 관리" });
</script>

<style scoped>
.product-search {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
  padding: 14px;
}

.thumb {
  width: 48px;
  height: 48px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  object-fit: cover;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.danger {
  color: var(--color-warning);
  font-weight: 900;
}

.clone-form {
  display: grid;
  gap: 14px;
}

.clone-summary {
  display: grid;
  gap: 4px;
  margin: 0;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fbf8f1;
  padding: 12px;
}

.clone-summary span,
.field-help {
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.clone-summary strong {
  color: var(--color-primary);
  font-size: 16px;
}

.clone-summary code {
  width: fit-content;
  border-radius: 6px;
  background: #fff;
  padding: 4px 6px;
  color: var(--color-primary);
  font-size: 12px;
}

.clone-row {
  display: grid;
  gap: 8px;
  color: var(--color-primary);
  font-weight: 900;
}

.field-help {
  margin: 0;
}

.clone-error {
  margin: 0;
  color: var(--color-warning);
  font-weight: 900;
}

.clone-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (min-width: 960px) {
  .product-search {
    grid-template-columns: minmax(0, 1fr) 180px 220px;
  }
}
</style>
