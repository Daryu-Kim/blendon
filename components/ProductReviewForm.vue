<template>
  <section
    class="review-form"
    :class="{ surface: !embedded, 'review-form--embedded': embedded }"
  >
    <div class="review-form__title">
      <h2>리뷰 작성</h2>
      <p>별점과 사용 후기를 남겨주세요.</p>
    </div>

    <div v-if="!auth.profile" class="login-box">
      <p>로그인 후 리뷰를 작성할 수 있습니다.</p>
      <Button to="/login" variant="secondary">로그인</Button>
    </div>

    <form v-else class="form-stack" @submit.prevent="submit">
      <div class="form-row">
        <label>별점</label>
        <div class="rating-input" role="radiogroup" aria-label="별점">
          <button
            v-for="score in 5"
            :key="score"
            type="button"
            :class="{ active: score <= rating }"
            :aria-label="`${score}점`"
            @click="rating = score"
          >
            ★
          </button>
        </div>
      </div>

      <div class="form-row">
        <label for="review-content">본문</label>
        <Textarea
          id="review-content"
          v-model="content"
          rows="5"
          placeholder="상품을 사용하며 좋았던 점을 작성해 주세요."
          required
        />
      </div>

      <div class="form-row">
        <label>사진/동영상</label>
        <ReviewMediaUploader
          v-model="media"
          :path-prefix="`reviews/${auth.profile.uid}/${product.id}`"
        />
      </div>

      <div class="review-actions">
        <Button type="submit" :disabled="submitting">
          {{ submitting ? "저장 중" : "리뷰 등록" }}
        </Button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import type { ProductReview, ReviewMedia } from "~/types/domain";

interface ReviewTarget {
  id: string;
  slug: string;
  name: string;
}

const props = withDefaults(
  defineProps<{ product: ReviewTarget; embedded?: boolean }>(),
  { embedded: false },
);
const emit = defineEmits<{ saved: [review: ProductReview] }>();

const auth = useAuthStore();
const reviewStore = useProductReviewStore();
const toast = useToast();
const rating = ref(5);
const content = ref("");
const media = ref<ReviewMedia[]>([]);
const submitting = ref(false);

const submit = async () => {
  const body = content.value.trim();
  if (!body) return;

  submitting.value = true;
  try {
    const review = await reviewStore.createReview({
      productId: props.product.id,
      productSlug: props.product.slug,
      productName: props.product.name,
      rating: rating.value,
      content: body,
      media: media.value,
    });
    rating.value = 5;
    content.value = "";
    media.value = [];
    toast.show("리뷰를 등록했습니다.", "success");
    emit("saved", review);
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  await auth.init();
});
</script>

<style scoped>
.review-form {
  display: grid;
  gap: 16px;
  padding: 18px;
}

.review-form--embedded {
  border-top: 1px solid var(--color-line);
  background: #fbf8f1;
  padding: 14px 0 0;
}

.review-form__title {
  display: grid;
  gap: 4px;
}

h2,
p {
  margin: 0;
}

.review-form__title p,
.login-box p {
  color: var(--color-muted);
}

.login-box,
.form-stack {
  display: grid;
  gap: 14px;
}

.rating-input {
  display: flex;
  gap: 3px;
}

.rating-input button {
  border: 0;
  background: transparent;
  color: #d8d0c4;
  padding: 0;
  font-size: 30px;
  line-height: 1;
  cursor: pointer;
}

.rating-input button.active {
  color: var(--color-accent);
}

.review-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
