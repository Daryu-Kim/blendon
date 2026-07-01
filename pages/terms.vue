<template>
  <main class="section page-shell policy-page">
    <div class="section-title">
      <div>
        <h1>이용약관</h1>
        <p>{{ brand.name }} 서비스 이용 조건을 안내합니다.</p>
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
import { legalConfig } from "~/config/legal";

const { brand } = useAppConfig();
const sections = legalConfig.terms;

useHead({ title: "이용약관" });
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
