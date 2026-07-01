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
        <form class="form-grid" @submit.prevent="submitted = true">
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
            문의가 접수되었습니다. 실제 운영에서는 Firestore inquiries 컬렉션에
            저장됩니다.
          </p>
        </form>
      </section>
      <section class="surface form-panel">
        <h2>운영 안내</h2>
        <p>
          회원, 주문, 배송, 픽업 정책은 공지사항과 이용안내에서 함께 확인할 수
          있습니다.
        </p>
        <Button to="/notices" variant="ghost">공지사항</Button>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
const title = ref("");
const content = ref("");
const submitted = ref(false);
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
</style>
