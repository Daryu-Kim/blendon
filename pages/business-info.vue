<template>
  <main class="section page-shell policy-page">
    <div class="section-title">
      <div>
        <h1>사업자 정보</h1>
        <p>전자상거래 운영자 정보를 안내합니다.</p>
      </div>
    </div>

    <section class="surface policy-panel">
      <dl class="business-list">
        <div v-for="item in businessItems" :key="item.label">
          <dt>{{ item.label }}</dt>
          <dd>{{ item.value }}</dd>
        </div>
      </dl>
      <p class="notice">실제 결제 운영 전 사업자등록증, 통신판매업 신고증, 고객센터 정보를 기준으로 최신 정보로 교체해야 합니다.</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { legalConfig } from '~/config/legal'

const businessItems = [
  { label: '상호', value: legalConfig.business.companyName },
  { label: '대표자', value: legalConfig.business.representative },
  { label: '사업자등록번호', value: legalConfig.business.businessRegistrationNumber },
  { label: '통신판매업 신고번호', value: legalConfig.business.mailOrderSalesNumber },
  { label: '사업장 주소', value: legalConfig.business.address },
  { label: '고객센터', value: legalConfig.business.customerServicePhone },
  { label: '이메일', value: legalConfig.business.customerServiceEmail },
  { label: '호스팅 서비스', value: legalConfig.business.hostingProvider }
]

useHead({ title: '사업자 정보' })
</script>

<style scoped>
.policy-page {
  min-height: 58vh;
}

.policy-panel {
  padding: 20px;
}

.business-list {
  display: grid;
  margin: 0;
}

.business-list div {
  display: grid;
  gap: 6px;
  border-bottom: 1px solid var(--color-line);
  padding: 14px 0;
}

.business-list div:first-child {
  padding-top: 0;
}

.business-list div:last-child {
  border-bottom: 0;
}

dt {
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

dd {
  margin: 0;
  font-weight: 800;
}

.notice {
  margin: 18px 0 0;
  color: var(--color-muted);
  line-height: 1.65;
}

@media (min-width: 760px) {
  .policy-panel {
    padding: 28px;
  }

  .business-list div {
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 18px;
  }
}
</style>
