<template>
  <main class="admin-page">
    <div class="section-title">
      <div>
        <h1>리뷰 관리</h1>
        <p>상품 리뷰를 확인하고 관리자 답변과 노출 상태를 관리합니다.</p>
      </div>
    </div>

    <section class="surface review-search">
      <Input v-model="keyword" placeholder="상품명, 회원명, 본문 검색" />
      <Select v-model="visibility">
        <option value="">전체 상태</option>
        <option value="true">노출</option>
        <option value="false">숨김</option>
      </Select>
    </section>

    <AdminTable :rows="filteredReviews" :columns="columns" row-key="id">
      <template #productName="{ row }">
        <NuxtLink :to="`/products/${row.productSlug}`" class="product-link">
          {{ row.productName }}
        </NuxtLink>
      </template>
      <template #userName="{ row }">
        <div>
          <strong>{{ row.userName }}</strong>
          <p>{{ row.userId }}</p>
        </div>
      </template>
      <template #rating="{ row }">
        <span class="rating">{{ row.rating }} ★</span>
      </template>
      <template #content="{ row }">
        <p class="content-preview">{{ row.content }}</p>
        <div v-if="row.media.length" class="media-preview">
          <a
            v-for="item in row.media.slice(0, 3)"
            :key="item.url"
            :href="item.url"
            target="_blank"
            rel="noopener"
          >
            <img
              v-if="item.type === 'image'"
              :src="item.url"
              :alt="item.name"
            />
            <video v-else :src="item.url" muted />
          </a>
        </div>
      </template>
      <template #isVisible="{ row }">
        <Select
          :model-value="String(row.isVisible)"
          @update:model-value="setVisibility(row.id, $event)"
        >
          <option value="true">노출</option>
          <option value="false">숨김</option>
        </Select>
      </template>
      <template #createdAt="{ row }">
        {{ formatDate(row.createdAt) }}
      </template>
      <template #actions="{ row }">
        <div class="reply-box">
          <Textarea
            :model-value="replies[row.id] ?? row.adminReply"
            rows="4"
            placeholder="관리자 답변"
            @update:model-value="replies[row.id] = $event"
          />
          <Button size="sm" @click="saveReply(row.id)">답변 저장</Button>
        </div>
      </template>
    </AdminTable>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });

const reviewStore = useProductReviewStore();
const keyword = ref("");
const visibility = ref("");
const replies = reactive<Record<string, string>>({});
const columns = [
  { key: "productName", label: "상품" },
  { key: "userName", label: "회원" },
  { key: "rating", label: "별점" },
  { key: "content", label: "리뷰" },
  { key: "isVisible", label: "상태" },
  { key: "createdAt", label: "작성일" },
] as const;

const filteredReviews = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  return reviewStore.reviews.filter((review) => {
    const matchesKeyword =
      !q ||
      review.productName.toLowerCase().includes(q) ||
      review.userName.toLowerCase().includes(q) ||
      review.content.toLowerCase().includes(q);
    const matchesVisibility =
      !visibility.value || String(review.isVisible) === visibility.value;
    return matchesKeyword && matchesVisibility;
  });
});

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const setVisibility = async (id: string, value: string) => {
  await reviewStore.setVisibility(id, value === "true");
};

const saveReply = async (id: string) => {
  await reviewStore.saveAdminReply(id, replies[id] ?? "");
  useToast().show("리뷰 답변을 저장했습니다.", "success");
};

onMounted(async () => {
  await reviewStore.fetchReviews(true);
});

useHead({ title: "관리자 리뷰 관리" });
</script>

<style scoped>
.review-search {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
  padding: 14px;
}

.product-link {
  font-weight: 900;
  word-break: keep-all;
}

.rating {
  color: var(--color-accent);
  font-weight: 900;
  white-space: nowrap;
}

.content-preview {
  display: -webkit-box;
  max-width: 320px;
  margin: 0;
  overflow: hidden;
  color: var(--color-muted);
  white-space: pre-wrap;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.media-preview {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.media-preview a {
  width: 42px;
  height: 42px;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
}

.media-preview img,
.media-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reply-box {
  display: grid;
  min-width: 280px;
  gap: 8px;
}

td p {
  margin: 0;
  color: var(--color-muted);
}

@media (min-width: 960px) {
  .review-search {
    grid-template-columns: minmax(0, 1fr) 160px;
  }
}
</style>
