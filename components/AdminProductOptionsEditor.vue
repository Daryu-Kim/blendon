<template>
  <div class="option-editor">
    <div class="option-toolbar">
      <div>
        <strong>상품 옵션</strong>
        <p>옵션명, 코드, 추가금액, 재고를 행 단위로 관리합니다.</p>
      </div>
      <Button type="button" size="sm" variant="secondary" @click="addOption">
        옵션 추가
      </Button>
    </div>

    <div class="option-table">
      <div class="option-head">
        <span>옵션명</span>
        <span>옵션 코드</span>
        <span>추가금액</span>
        <span>재고</span>
        <span>상태</span>
        <span>관리</span>
      </div>

      <div
        v-for="(option, index) in options"
        :key="option.optionId"
        class="option-row"
      >
        <Input
          v-model="option.optionName"
          aria-label="옵션명"
          placeholder="예: Peach / 기본"
          @update:model-value="sync"
        />
        <Input
          v-model="option.optionCode"
          aria-label="옵션 코드"
          placeholder="예: PEACH"
          @update:model-value="sync"
        />
        <Input
          v-model="option.additionalPrice"
          aria-label="추가금액"
          min="0"
          type="number"
          @update:model-value="sync"
        />
        <Input
          v-model="option.stock"
          aria-label="옵션 재고"
          min="0"
          type="number"
          @update:model-value="sync"
        />
        <Select
          :model-value="String(option.isActive)"
          aria-label="옵션 상태"
          @update:model-value="setActive(index, $event)"
        >
          <option value="true">판매</option>
          <option value="false">숨김</option>
        </Select>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          :disabled="options.length <= 1"
          @click="removeOption(index)"
        >
          삭제
        </Button>
      </div>
    </div>

    <p class="option-help">
      옵션이 하나뿐인 상품도 기본 옵션을 유지해야 장바구니와 주문 재고 차감이
      안정적으로 동작합니다.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { ProductOption } from "~/types/domain";
import { toSafeId } from "~/utils/format";

const props = defineProps<{ modelValue: ProductOption[] }>();
const emit = defineEmits<{ "update:modelValue": [value: ProductOption[]] }>();

const createOption = (index: number): ProductOption => ({
  optionId: `option-${Date.now()}-${index}`,
  optionName: index === 0 ? "기본" : "",
  optionCode: index === 0 ? "DEFAULT" : "",
  additionalPrice: 0,
  stock: 0,
  isActive: true,
});

const normalizeOption = (
  option: ProductOption,
  index: number,
): ProductOption => {
  const optionName =
    String(option.optionName || "").trim() ||
    (index === 0 ? "기본" : `옵션 ${index + 1}`);
  const optionCode =
    String(option.optionCode || "").trim() ||
    toSafeId(optionName).toUpperCase();
  return {
    optionId: option.optionId || `option-${toSafeId(optionName)}-${index}`,
    optionName,
    optionCode,
    additionalPrice: Math.max(0, Number(option.additionalPrice || 0)),
    stock: Math.max(0, Number(option.stock || 0)),
    isActive: option.isActive !== false,
  };
};

const cloneOptions = (value: ProductOption[]) =>
  (value?.length ? value : [createOption(0)]).map((option, index) =>
    normalizeOption({ ...option }, index),
  );

const options = ref<ProductOption[]>(cloneOptions(props.modelValue));

const sync = () => {
  emit(
    "update:modelValue",
    options.value.map((option, index) => normalizeOption(option, index)),
  );
};

const setActive = (index: number, value: string) => {
  options.value[index] = {
    ...options.value[index],
    isActive: value === "true",
  };
  sync();
};

const addOption = () => {
  options.value = [...options.value, createOption(options.value.length)];
  sync();
};

const removeOption = (index: number) => {
  if (options.value.length <= 1) return;
  options.value = options.value.filter(
    (_, optionIndex) => optionIndex !== index,
  );
  sync();
};

watch(
  () => props.modelValue,
  (value) => {
    options.value = cloneOptions(value);
  },
  { deep: true },
);
</script>

<style scoped>
.option-editor {
  display: grid;
  gap: 12px;
}

.option-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.option-toolbar strong {
  display: block;
  margin-bottom: 4px;
}

.option-toolbar p,
.option-help {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
}

.option-table {
  display: grid;
  gap: 8px;
  overflow-x: auto;
}

.option-head,
.option-row {
  display: grid;
  min-width: 920px;
  grid-template-columns: 1.3fr 1fr 120px 120px 120px 88px;
  gap: 8px;
  align-items: center;
}

.option-head {
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 900;
}

.option-row {
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  padding: 8px;
}

@media (max-width: 720px) {
  .option-toolbar {
    display: grid;
  }
}
</style>
