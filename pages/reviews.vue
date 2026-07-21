<template>
  <main class="section page-shell reviews-page">
    <div class="reviews-head">
      <div>
        <p class="eyebrow">REVIEWS</p>
        <h1>구매후기</h1>
        <p>
          실제 구매 고객이 남긴 후기를 모았습니다. 회원 등급에 맞게 열람 가능한
          상품의 후기만 표시됩니다.
        </p>
      </div>
      <nav aria-label="현재 위치">
        <NuxtLink to="/">Home</NuxtLink>
        <span>쇼핑몰</span>
        <strong>구매후기</strong>
      </nav>
    </div>

    <section class="surface review-tools">
      <div class="tool-row">
        <Select v-model="searchField" aria-label="검색 항목">
          <option value="all">전체</option>
          <option value="product">상품명</option>
          <option value="content">후기내용</option>
          <option value="writer">작성자</option>
        </Select>
        <Select v-model="ratingFilter" aria-label="별점 필터">
          <option value="">전체 별점</option>
          <option value="5">별점 5점</option>
          <option value="4">별점 4점 이상</option>
          <option value="3">별점 3점 이상</option>
        </Select>
        <Select v-model="sortMode" aria-label="정렬">
          <option value="latest">최신순</option>
          <option value="rating">별점 높은순</option>
        </Select>
      </div>
      <div class="search-row">
        <Search :size="18" aria-hidden="true" />
        <input
          v-model="searchKeyword"
          type="search"
          placeholder="검색어를 입력해 주세요."
          aria-label="구매후기 검색어"
        >
        <Button type="button" variant="ghost" @click="resetFilters">
          전체보기
        </Button>
      </div>
    </section>

    <section v-if="filteredReviews.length" class="review-grid">
      <article
        v-for="item in filteredReviews"
        :key="item.review.id"
        class="surface review-card"
      >
        <NuxtLink
          class="product-media"
          :to="`/products/${item.product.slug || item.product.id}`"
        >
          <img
            v-if="item.product.thumbnailUrl"
            :src="item.product.thumbnailUrl"
            :alt="item.product.name"
          >
          <div v-else class="product-media-empty">
            {{ item.product.name }}
          </div>
        </NuxtLink>

        <div class="review-body">
          <NuxtLink
            class="product-name"
            :to="`/products/${item.product.slug || item.product.id}`"
          >
            {{ item.product.name }}
          </NuxtLink>
          <h2>{{ reviewTitle(item.review.content) }}</h2>
          <p class="review-content">{{ item.review.content }}</p>

          <div v-if="item.review.media.length" class="media-strip">
            <a
              v-for="media in item.review.media.slice(0, 3)"
              :key="media.url"
              :href="media.url"
              target="_blank"
              rel="noopener"
            >
              <img
                v-if="media.type === 'image'"
                :src="media.url"
                :alt="media.name || item.product.name"
              >
              <span v-else>동영상</span>
            </a>
          </div>

          <div v-if="item.review.adminReply" class="admin-reply">
            <strong>관리자 답변</strong>
            <p>{{ item.review.adminReply }}</p>
          </div>
        </div>

        <footer class="review-meta">
          <span>{{ maskWriter(item.review.userName) }}</span>
          <time>{{ formatDate(item.review.createdAt) }}</time>
          <div class="stars" :aria-label="`별점 ${item.review.rating}점`">
            <Star
              v-for="score in 5"
              :key="score"
              :size="15"
              :class="{ active: score <= item.review.rating }"
              aria-hidden="true"
            />
          </div>
        </footer>
      </article>
    </section>

    <EmptyState
      v-else
      title="표시할 구매후기가 없습니다."
      description="검색 조건을 바꾸거나 열람 가능한 상품 후기가 등록되면 이곳에 표시됩니다."
      action-label="상품 보러가기"
      action-to="/products"
    />
  </main>
</template>

<script setup lang="ts">
import { Search, Star } from "@lucide/vue";
import type { Product, ProductReview } from "~/types/domain";
import { canViewProductWithCategories } from "~/utils/access";

type ReviewWithProduct = {
  review: ProductReview;
  product: Product;
};

const auth = useAuthStore();
const productStore = useProductStore();
const reviewStore = useProductReviewStore();
const searchField = ref("all");
const searchKeyword = ref("");
const ratingFilter = ref("");
const sortMode = ref("latest");

const accessibleReviewItems = computed<ReviewWithProduct[]>(() =>
  reviewStore.reviews
    .filter((review) => review.isVisible)
    .map((review) => {
      const product = productStore.findById(review.productId);
      return product ? { review, product } : null;
    })
    .filter((item): item is ReviewWithProduct =>
      Boolean(
        item &&
          canViewProductWithCategories(
            item.product,
            productStore.categories,
            auth.profile,
            productStore.gradeBenefits,
          ),
      ),
    ),
);

const normalizedKeyword = computed(() =>
  searchKeyword.value.trim().toLowerCase(),
);
const filteredReviews = computed(() => {
  const minRating = Number(ratingFilter.value || 0);
  const searched = accessibleReviewItems.value.filter((item) => {
    if (minRating && item.review.rating < minRating) return false;
    if (!normalizedKeyword.value) return true;

    const fields = {
      product: item.product.name,
      content: item.review.content,
      writer: item.review.userName,
      all: `${item.product.name} ${item.review.content} ${item.review.userName}`,
    };
    return fields[searchField.value as keyof typeof fields]
      .toLowerCase()
      .includes(normalizedKeyword.value);
  });

  return [...searched].sort((a, b) => {
    if (sortMode.value === "rating") {
      return (
        b.review.rating - a.review.rating ||
        b.review.createdAt.localeCompare(a.review.createdAt)
      );
    }
    return b.review.createdAt.localeCompare(a.review.createdAt);
  });
});

const reviewTitle = (content: string) => {
  const firstLine = content.trim().split(/\n/)[0]?.trim() || "구매후기";
  return firstLine.length > 32 ? `${firstLine.slice(0, 32)}...` : firstLine;
};

const maskWriter = (name: string) => {
  const normalized = name.trim();
  if (!normalized) return "고객";
  if (normalized.length <= 2) return `${normalized[0]}*`;
  return `${normalized.slice(0, 2)}${"*".repeat(Math.min(6, normalized.length - 2))}`;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(
    new Date(value),
  );

const resetFilters = () => {
  searchField.value = "all";
  searchKeyword.value = "";
  ratingFilter.value = "";
  sortMode.value = "latest";
};

onMounted(async () => {
  await auth.init();
  await Promise.all([
    productStore.fetchCatalog(),
    reviewStore.fetchPublicReviews(true),
  ]);
});

useHead({ title: "구매후기" });
</script>

<style scoped>
.reviews-page {
  display: grid;
  gap: 22px;
}

.reviews-head {
  display: grid;
  gap: 14px;
}

.reviews-head h1,
.reviews-head p,
.review-card h2,
.review-card p,
.admin-reply p {
  margin: 0;
}

.reviews-head h1 {
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.15;
}

.reviews-head > div > p:last-child {
  margin-top: 8px;
  color: var(--color-muted);
  line-height: 1.6;
}

.reviews-head nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.reviews-head nav span::before,
.reviews-head nav strong::before {
  margin-right: 8px;
  content: ">";
}

.reviews-head nav strong {
  color: var(--color-primary);
}

.review-tools {
  display: grid;
  gap: 12px;
  padding: 14px;
}

.tool-row {
  display: grid;
  gap: 8px;
}

.search-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  padding: 0 10px;
}

.search-row svg {
  color: var(--color-muted);
}

.search-row input {
  width: 100%;
  min-height: 46px;
  border: 0;
  outline: 0;
}

.review-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 18px;
}

.review-card {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
}

.product-media,
.product-media-empty {
  display: grid;
  aspect-ratio: 1;
  place-items: center;
  background: #fff;
}

.product-media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 12px;
}

.product-media-empty {
  color: var(--color-muted);
  padding: 16px;
  text-align: center;
  font-weight: 900;
}

.review-body {
  display: grid;
  align-content: start;
  gap: 8px;
  padding: 14px 14px 10px;
}

.product-name {
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 900;
  line-height: 1.35;
}

.review-card h2 {
  font-size: 17px;
  line-height: 1.35;
}

.review-content {
  display: -webkit-box;
  overflow: hidden;
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  white-space: pre-wrap;
  word-break: keep-all;
}

.media-strip {
  display: flex;
  gap: 6px;
  margin-top: 2px;
}

.media-strip a {
  display: grid;
  width: 42px;
  aspect-ratio: 1;
  overflow: hidden;
  place-items: center;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fbf8f1;
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 900;
}

.media-strip img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-reply {
  display: grid;
  gap: 6px;
  border-radius: 8px;
  background: #fbf8f1;
  margin-top: 4px;
  padding: 10px;
}

.admin-reply strong {
  color: #8d6b28;
  font-size: 12px;
}

.admin-reply p {
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: keep-all;
}

.review-meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px 10px;
  align-items: center;
  border-top: 1px solid var(--color-line);
  padding: 12px 14px 14px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.stars {
  grid-column: 1 / -1;
  display: flex;
  gap: 1px;
}

.stars svg {
  color: #d8d0c4;
  fill: currentColor;
  stroke-width: 2.2;
}

.stars svg.active {
  color: var(--color-accent);
}

@media (min-width: 760px) {
  .reviews-head {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .tool-row {
    grid-template-columns: 220px 180px 180px;
  }
}

@media (max-width: 560px) {
  .search-row {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .search-row .ui-button {
    grid-column: 1 / -1;
    margin-bottom: 10px;
  }
}
</style>
