<template>
  <section
    class="review-list"
    :class="{ surface: !embedded, 'review-list--embedded': embedded }"
  >
    <div class="review-summary">
      <div>
        <h2>리뷰</h2>
        <p>{{ reviews.length }}개</p>
      </div>
      <div v-if="reviews.length" class="average">
        <strong>{{ averageRating }}</strong>
        <span>★</span>
      </div>
    </div>

    <div v-if="reviews.length" class="review-items">
      <article v-for="review in reviews" :key="review.id" class="review-item">
        <header>
          <div>
            <strong>{{ review.userName }}</strong>
            <p>{{ formatDate(review.createdAt) }}</p>
          </div>
          <div class="stars" :aria-label="`${review.rating}점`">
            <span
              v-for="score in 5"
              :key="score"
              :class="{ active: score <= review.rating }"
            >
              ★
            </span>
          </div>
        </header>
        <p class="review-content">{{ review.content }}</p>

        <div v-if="review.media.length" class="review-media-grid">
          <a
            v-for="item in review.media"
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

        <div v-if="review.adminReply" class="admin-reply">
          <span>관리자 답변</span>
          <p>{{ review.adminReply }}</p>
        </div>
      </article>
    </div>

    <EmptyState
      v-else
      title="아직 등록된 리뷰가 없어요."
      description="첫 리뷰를 남겨보세요."
    />
  </section>
</template>

<script setup lang="ts">
import type { ProductReview } from "~/types/domain";

const props = withDefaults(
  defineProps<{ reviews: ProductReview[]; embedded?: boolean }>(),
  { embedded: false },
);

const averageRating = computed(() => {
  if (!props.reviews.length) return "0.0";
  const total = props.reviews.reduce((sum, review) => sum + review.rating, 0);
  return (total / props.reviews.length).toFixed(1);
});

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
  }).format(new Date(value));
</script>

<style scoped>
.review-list {
  display: grid;
  gap: 18px;
  padding: 18px;
}

.review-list--embedded {
  padding: 0;
}

.review-summary {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
}

h2,
p {
  margin: 0;
}

.review-summary p,
.review-item header p {
  color: var(--color-muted);
  font-size: 14px;
}

.average {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-accent);
}

.average strong {
  color: var(--color-primary);
  font-size: 30px;
  line-height: 1;
}

.review-items {
  display: grid;
  gap: 14px;
}

.review-item {
  display: grid;
  gap: 12px;
  border-top: 1px solid var(--color-line);
  padding-top: 14px;
}

.review-item header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.stars {
  white-space: nowrap;
}

.stars span {
  color: #d8d0c4;
}

.stars span.active {
  color: var(--color-accent);
}

.review-content {
  color: var(--color-primary);
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: keep-all;
}

.review-media-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.review-media-grid a {
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
}

.review-media-grid img,
.review-media-grid video {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.admin-reply {
  display: grid;
  gap: 6px;
  border-radius: 8px;
  background: #fbf8f1;
  padding: 12px;
}

.admin-reply span {
  color: #8d6b28;
  font-size: 12px;
  font-weight: 900;
}

.admin-reply p {
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: keep-all;
}

@media (min-width: 760px) {
  .review-media-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>
