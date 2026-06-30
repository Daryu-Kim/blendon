<template>
  <main class="section page-shell">
    <div class="section-title">
      <div>
        <h1>마이페이지</h1>
        <p>회원 등급, 포인트, 주문 정보를 확인합니다.</p>
      </div>
      <Button variant="ghost" @click="logout">로그아웃</Button>
    </div>
    <div class="mypage-grid">
      <section class="surface panel">
        <h2>{{ auth.profile?.displayName }}</h2>
        <dl>
          <div><dt>이메일</dt><dd>{{ auth.profile?.email }}</dd></div>
          <div><dt>등급</dt><dd>{{ auth.profile?.userGrade }}</dd></div>
          <div><dt>보유 포인트</dt><dd>{{ formatCurrency(auth.profile?.availablePoint || 0) }}</dd></div>
        </dl>
      </section>
      <section class="surface panel">
        <h2>빠른 이동</h2>
        <div class="quick-links">
          <Button to="/orders" variant="ghost">주문 내역</Button>
          <Button to="/cart" variant="ghost">장바구니</Button>
          <Button v-if="auth.isAdmin" to="/admin" variant="secondary">관리자</Button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

definePageMeta({ middleware: 'auth' })
const auth = useAuthStore()
const router = useRouter()
const logout = async () => {
  await auth.signOut()
  await router.push('/')
}

useHead({ title: '마이페이지' })
</script>

<style scoped>
.mypage-grid {
  display: grid;
  gap: 16px;
}

.panel {
  padding: 20px;
}

h2 {
  margin: 0 0 16px;
}

dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

dl div {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

dd {
  margin: 0;
  font-weight: 900;
}

.quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

@media (min-width: 760px) {
  .mypage-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
