<template>
  <main class="section page-shell">
    <div class="section-title">
      <div>
        <h1>이용안내</h1>
        <p>회원가입, 주문, 결제, 배송, 문의 이용 흐름을 안내합니다.</p>
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
    title: "회원가입과 본인확인",
    description:
      "회원가입 단계에서 본인확인을 진행합니다. 가입 후에는 별도 인증 상태를 소비자 화면에 반복 노출하지 않습니다.",
  },
  {
    title: "상품 정보와 구매 제한",
    description:
      "상품별 등급, 재고, 판매 상태에 따라 상세 정보와 구매 가능 여부가 달라질 수 있습니다.",
  },
  {
    title: "주문과 결제",
    description:
      "주문 금액과 재고는 서버에서 다시 확인한 뒤 결제를 진행합니다. 결제 완료 여부도 서버 검증 후 확정됩니다.",
  },
  {
    title: "배송 안내",
    description:
      "배송 상품은 주문서에서 주소를 입력합니다. 배송비, 출고 일정, 제한 지역은 운영 정책에 따라 공지됩니다.",
  },
  {
    title: "취소/환불",
    description:
      "결제 취소, 환불, 청약철회 기준은 취소/환불 정책을 우선 적용합니다. 상품 상태와 출고 여부에 따라 처리 방식이 달라질 수 있습니다.",
  },
  {
    title: "고객센터",
    description:
      "상품, 주문, 결제, 배송 관련 문의는 고객센터에서 접수할 수 있으며 운영자가 관리자 페이지에서 확인합니다.",
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
