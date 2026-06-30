<template>
  <main class="section page-shell policy-page">
    <div class="section-title">
      <div>
        <h1>개인정보처리방침</h1>
        <p>회원가입, 성인 확인, 주문 처리를 위한 개인정보 처리 기준입니다.</p>
      </div>
    </div>

    <article class="surface policy-panel">
      <p>시행일: {{ legalConfig.effectiveDate }}</p>
      <section v-for="section in sections" :key="section.title">
        <h2>{{ section.title }}</h2>
        <p>{{ section.body }}</p>
      </section>
    </article>
  </main>
</template>

<script setup lang="ts">
import { legalConfig } from '~/config/legal'

const sections = legalConfig.privacy

useHead({ title: '개인정보처리방침' })
</script>

<style scoped>
.policy-panel {
  display: grid;
  gap: 22px;
  padding: 20px;
}

h2,
p {
  margin: 0;
}

h2 {
  font-size: 18px;
}

p {
  color: var(--color-muted);
  line-height: 1.75;
}

section {
  display: grid;
  gap: 8px;
}

@media (min-width: 760px) {
  .policy-panel {
    padding: 30px;
  }
}
</style>
