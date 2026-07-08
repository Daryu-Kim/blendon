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
    </section>
  </main>
</template>

<script setup lang="ts">
const { data: globalSettings } = await useAsyncData(
  "site-global-settings",
  () => $fetch("/api/site-settings/global"),
);

const businessItems = computed(() => [
  { label: "상호", value: globalSettings.value?.businessName || "-" },
  { label: "대표자", value: globalSettings.value?.representativeName || "-" },
  {
    label: "사업자등록번호",
    value: globalSettings.value?.businessRegistrationNumber || "-",
  },
  {
    label: "통신판매업 신고번호",
    value: globalSettings.value?.mailOrderSalesNumber || "-",
  },
  { label: "사업장 주소", value: globalSettings.value?.businessAddress || "-" },
  {
    label: "고객센터",
    value: globalSettings.value?.customerCenterPhone || "-",
  },
  { label: "이메일", value: globalSettings.value?.customerCenterEmail || "-" },
  { label: "호스팅 서비스", value: "Vercel" },
]);

useHead({ title: "사업자 정보" });
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
