<template>
  <form class="search-bar" role="search" @submit.prevent="submit">
    <Search :size="18" aria-hidden="true" />
    <input
      v-model="query"
      type="search"
      placeholder="상품, 향, 무드 검색"
      aria-label="상품 검색"
    />
    <button type="submit" title="검색">
      <ArrowRight :size="18" aria-hidden="true" />
    </button>
  </form>
</template>

<script setup lang="ts">
import { ArrowRight, Search } from "@lucide/vue";

const productStore = useProductStore();
const router = useRouter();
const query = ref(productStore.query);
const submit = async () => {
  productStore.setQuery(query.value);
  await router.push({
    path: "/products",
    query: query.value ? { q: query.value } : undefined,
  });
};
</script>

<style scoped>
.search-bar {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) 36px;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--color-line);
  border-radius: 999px;
  background: #fff;
  padding: 0 8px 0 14px;
}

.search-bar input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
}

.search-bar button {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
}
</style>
