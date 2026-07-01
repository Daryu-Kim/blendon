<template>
  <main class="section page-shell">
    <div class="section-title">
      <div>
        <h1>이용안내</h1>
        <p>배송, 픽업, 멤버십, 상품 노출 정책을 안내합니다.</p>
      </div>
    </div>
    <div class="guide-grid">
      <section
        v-for="item in items"
        :key="item.title"
        class="surface guide-card"
      >
        <h2>{{ item.title }}</h2>
        <p>{{ item.description }}</p>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
const items = [
  {
    title: "성인 회원 확인",
    description:
      "성인 전용 카테고리의 상세 정보, 가격, 구매 버튼은 회원가입 시 확인된 성인 회원에게만 노출됩니다.",
  },
  {
    title: "배송",
    description:
      "초기 버전은 기본 배송 구조를 제공하며, 실제 정책은 사업자 정보 확정 후 적용합니다.",
  },
  {
    title: "매장 픽업",
    description:
      "오프라인 상가 매장과 라운지 오픈에 맞춰 주문 후 픽업 흐름을 확장합니다.",
  },
  {
    title: "회원 등급",
    description:
      "내부 등급은 G1~G10으로 확장 가능하며 화면에는 BASIC, PLUS, PRO, VIP, BLACK으로 표시합니다.",
  },
];

useHead({ title: "이용안내" });
</script>

<style scoped>
.guide-grid {
  display: grid;
  gap: 14px;
}

.guide-card {
  padding: 20px;
}

h2,
p {
  margin: 0;
}

p {
  margin-top: 8px;
  color: var(--color-muted);
}

@media (min-width: 760px) {
  .guide-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
