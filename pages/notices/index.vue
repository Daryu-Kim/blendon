<template>
  <main class="section page-shell">
    <div class="section-title">
      <div>
        <h1>공지사항</h1>
        <p>서비스 운영과 인증 정책 관련 안내입니다.</p>
      </div>
    </div>
    <div class="notice-list">
      <article v-for="notice in notices" :key="notice.id" class="surface notice-card">
        <span v-if="notice.isPinned" class="pill">고정</span>
        <h2>{{ notice.title }}</h2>
        <p>{{ notice.content }}</p>
        <small>{{ formatDate(notice.createdAt) }}</small>
      </article>
    </div>
  </main>
</template>

<script setup lang="ts">
import { mockNotices } from '~/data/mock'
import { formatDate } from '~/utils/format'

const notices = mockNotices
useHead({ title: '공지사항' })
</script>

<style scoped>
.notice-list {
  display: grid;
  gap: 12px;
}

.notice-card {
  display: grid;
  gap: 10px;
  padding: 18px;
}

h2,
p {
  margin: 0;
}

p,
small {
  color: var(--color-muted);
}
</style>
