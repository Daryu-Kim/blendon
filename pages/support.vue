<template>
  <main class="section page-shell">
    <div class="section-title">
      <div>
        <h1>고객센터/문의</h1>
        <p>상품, 주문, 회원 관련 문의를 남겨 주세요.</p>
      </div>
    </div>
    <div class="two-column">
      <section class="surface form-panel">
        <h2>문의 작성</h2>
        <form v-if="auth.isLoggedIn" class="form-grid" @submit.prevent="submit">
          <div class="form-row">
            <label for="title">제목</label>
            <Input id="title" v-model="title" required />
          </div>
          <div class="form-row">
            <label for="content">내용</label>
            <Textarea id="content" v-model="content" required />
          </div>
          <Button type="submit">문의 남기기</Button>
          <p v-if="submitted" class="success">
            문의가 접수되었습니다. 답변은 고객센터 또는 마이페이지에서 확인할 수
            있도록 확장할 수 있습니다.
          </p>
          <p v-if="error" class="error">{{ error }}</p>
        </form>
        <div v-else class="login-guide">
          <p>문의 작성은 로그인 후 이용할 수 있습니다.</p>
          <Button to="/login">로그인</Button>
        </div>
      </section>
      <section class="surface form-panel">
        <h2>운영 안내</h2>
        <p>
          주문, 배송, 결제, 상품 이용 관련 문의를 남겨주시면 운영자가 순차적으로
          확인합니다. 취소/환불 관련 기준은 정책 페이지에서 먼저 확인할 수
          있습니다.
        </p>
        <div class="support-links">
          <Button to="/notices" variant="ghost">공지사항</Button>
          <Button to="/refund-policy" variant="ghost">취소/환불 정책</Button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { toUserMessage } from "~/utils/error-message";

const auth = useAuthStore();
const inquiries = useInquiryStore();
const title = ref("");
const content = ref("");
const submitted = ref(false);
const error = ref("");

onMounted(async () => {
  await auth.init();
});

const submit = async () => {
  error.value = "";
  submitted.value = false;
  if (!title.value.trim() || !content.value.trim()) {
    error.value = "제목과 내용을 입력해 주세요.";
    return;
  }
  try {
    await inquiries.createInquiry({
      title: title.value,
      content: content.value,
    });
    title.value = "";
    content.value = "";
    submitted.value = true;
  } catch (e) {
    error.value = toUserMessage(e, "문의 접수에 실패했어요. 잠시 후 다시 시도해 주세요.");
  }
};

useHead({ title: "고객센터" });
</script>

<style scoped>
.form-panel {
  display: grid;
  gap: 16px;
  padding: 20px;
}

h2,
p {
  margin: 0;
}

p {
  color: var(--color-muted);
}

.success {
  color: #497a5b;
  font-weight: 800;
}

.error {
  color: var(--color-warning);
  font-weight: 800;
}

.login-guide,
.support-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
</style>
