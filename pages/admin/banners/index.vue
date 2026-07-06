<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>배너/콘텐츠 관리</h1>
        <p>홈 메인 배너와 콘텐츠 영역을 검색하고 관리합니다.</p>
      </div>
      <Button to="/admin/banners/new" variant="secondary">배너 추가</Button>
    </div>

    <section class="surface banner-search">
      <Input v-model="keyword" placeholder="제목, 부제목, 링크 검색" />
      <Select v-model="placement">
        <option value="">전체 위치</option>
        <option value="home-main">홈 메인</option>
        <option value="home-section">홈 섹션</option>
        <option value="notice">공지</option>
      </Select>
      <Select v-model="active">
        <option value="">전체 상태</option>
        <option value="true">활성</option>
        <option value="false">비활성</option>
      </Select>
    </section>

    <AdminTable :rows="filteredBanners" :columns="columns" row-key="id">
      <template #imageUrl="{ row }">
        <img
          v-if="row.imageUrl"
          class="thumb"
          :src="row.imageUrl"
          :alt="row.title"
        >
        <span v-else>-</span>
      </template>
      <template #productId="{ row }">
        <div v-if="productById(row.productId)" class="product-cell">
          <img
            v-if="productById(row.productId)?.thumbnailUrl"
            class="product-thumb"
            :src="productById(row.productId)?.thumbnailUrl"
            :alt="productById(row.productId)?.name"
          >
          <span>{{ productById(row.productId)?.name }}</span>
        </div>
        <span v-else>-</span>
      </template>
      <template #isActive="{ row }">{{ row.isActive ? "활성" : "비활성" }}</template>
      <template #actions="{ row }">
        <div class="row-actions">
          <Button size="sm" variant="ghost" :to="`/admin/banners/${row.id}`">
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
definePageMeta({ layout: "admin", middleware: "admin" });

const bannerStore = useBannerStore();
const productStore = useProductStore();
const keyword = ref("");
const placement = ref("");
const active = ref("");
const columns = [
  { key: "imageUrl", label: "이미지" },
  { key: "slug", label: "슬러그" },
  { key: "title", label: "제목" },
  { key: "subtitle", label: "부제목" },
  { key: "productId", label: "연결 상품" },
  { key: "buttonText", label: "버튼" },
  { key: "linkUrl", label: "링크" },
  { key: "placement", label: "위치" },
  { key: "order", label: "순서" },
  { key: "isActive", label: "상태" },
] as const;

const productById = (productId?: string) =>
  productId ? productStore.findById(productId) : null;

const filteredBanners = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  return bannerStore.banners.filter((banner) => {
    const product = productById(banner.productId);
    const matchesKeyword =
      !q ||
      banner.slug.toLowerCase().includes(q) ||
      banner.title.toLowerCase().includes(q) ||
      banner.subtitle.toLowerCase().includes(q) ||
      banner.linkUrl.toLowerCase().includes(q) ||
      Boolean(product?.name.toLowerCase().includes(q));
    const matchesPlacement =
      !placement.value || banner.placement === placement.value;
    const matchesActive =
      !active.value || String(banner.isActive) === active.value;
    return matchesKeyword && matchesPlacement && matchesActive;
  });
});

const remove = async (id: string) => {
  if (!confirm("배너를 삭제할까요?")) return;
  await bannerStore.deleteBanner(id);
};

onMounted(async () => {
  await Promise.all([
    bannerStore.fetchBanners(true),
    productStore.fetchCatalog(),
  ]);
});

useHead({ title: "관리자 배너 관리" });
</script>

<style scoped>
.banner-search {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
  padding: 14px;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.thumb {
  width: 72px;
  height: 42px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  object-fit: cover;
}

.product-cell {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-width: 180px;
}

.product-thumb {
  width: 38px;
  aspect-ratio: 1;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  object-fit: cover;
}

.product-cell span {
  font-weight: 800;
  word-break: keep-all;
}

@media (min-width: 960px) {
  .banner-search {
    grid-template-columns: minmax(0, 1fr) 180px 160px;
  }
}
</style>
