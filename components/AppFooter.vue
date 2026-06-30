<template>
  <footer class="app-footer">
    <div class="page-shell footer-grid">
      <section>
        <h2>{{ brand.name }}</h2>
        <p>{{ brand.description }}</p>
        <p class="muted">{{ brand.businessInfoPlaceholder }}</p>
      </section>
      <nav aria-label="하단 메뉴">
        <NuxtLink to="/guide">이용안내</NuxtLink>
        <NuxtLink to="/products">상품 보기</NuxtLink>
        <NuxtLink to="/support">고객센터</NuxtLink>
        <NuxtLink to="/notices">공지사항</NuxtLink>
      </nav>
      <nav aria-label="정책 메뉴">
        <NuxtLink to="/business-info">사업자 정보</NuxtLink>
        <NuxtLink to="/terms">이용약관</NuxtLink>
        <NuxtLink to="/privacy">개인정보처리방침</NuxtLink>
        <NuxtLink to="/refund-policy">취소/환불 정책</NuxtLink>
      </nav>
      <section>
        <h3>고객센터</h3>
        <p>{{ brand.supportPhone }}</p>
        <p>{{ brand.supportEmail }}</p>
      </section>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { brand } = useAppConfig()
</script>

<style scoped>
.app-footer {
  margin-top: 48px;
  border-top: 1px solid var(--color-line);
  background: #fff;
  padding: 32px 0;
}

.footer-grid {
  display: grid;
  gap: 24px;
}

.app-footer h2,
.app-footer h3,
.app-footer p {
  margin: 0;
}

.app-footer h2 {
  margin-bottom: 8px;
}

.app-footer p {
  margin-top: 6px;
  color: var(--color-muted);
}

.app-footer nav {
  display: grid;
  gap: 10px;
  font-weight: 800;
}

@media (min-width: 760px) {
  .footer-grid {
    grid-template-columns: minmax(0, 1.4fr) minmax(150px, 0.55fr) minmax(170px, 0.7fr) minmax(170px, 0.65fr);
  }
}
</style>
