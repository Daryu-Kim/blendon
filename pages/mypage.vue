<template>
  <main class="section page-shell mypage-page">
    <div class="mypage-head">
      <div>
        <p class="eyebrow">MY BLEND</p>
        <h1>{{ displayName }}님, 반갑습니다.</h1>
        <p>
          주문 진행 상황, 보유 혜택, 계정 상태를 한 번에 확인할 수 있어요.
        </p>
      </div>
      <div class="head-actions">
        <Button to="/products" variant="secondary" :icon="ShoppingBag">
          쇼핑 계속하기
        </Button>
        <Button variant="ghost" :icon="LogOut" @click="logout">
          로그아웃
        </Button>
      </div>
    </div>

    <section class="status-strip" aria-label="회원 요약">
      <article
        v-for="metric in summaryMetrics"
        :key="metric.label"
        class="surface metric-card"
      >
        <component :is="metric.icon" :size="21" aria-hidden="true" />
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <small>{{ metric.help }}</small>
      </article>
    </section>

    <div class="mypage-layout">
      <section class="surface profile-card">
        <div class="card-head">
          <div>
            <span class="section-kicker">회원 정보</span>
            <h2>{{ displayName }}</h2>
          </div>
          <span class="state-pill" :class="{ verified: auth.isAdultVerified }">
            {{ auth.isAdultVerified ? "성인 인증 완료" : "성인 인증 필요" }}
          </span>
        </div>

        <dl class="profile-list">
          <div>
            <dt>이메일</dt>
            <dd>{{ auth.profile?.email || "-" }}</dd>
          </div>
          <div>
            <dt>휴대폰</dt>
            <dd>{{ auth.profile?.phoneNumber || "-" }}</dd>
          </div>
          <div>
            <dt>회원 등급</dt>
            <dd>{{ gradeLabel }}</dd>
          </div>
          <div>
            <dt>보유 포인트</dt>
            <dd>{{ formatCurrency(auth.profile?.availablePoint || 0) }}</dd>
          </div>
        </dl>

        <div v-if="auth.profile?.mustChangePassword" class="notice-panel">
          <strong>비밀번호 변경이 필요합니다.</strong>
          <p>관리자가 임시로 생성한 계정은 첫 로그인 후 비밀번호를 바꿔야 합니다.</p>
          <Button to="/account/change-password" size="sm">변경하기</Button>
        </div>
      </section>

      <section class="surface benefit-card">
        <div class="card-head">
          <div>
            <span class="section-kicker">등급 혜택</span>
            <h2>{{ gradeLabel }} 혜택</h2>
          </div>
          <Gift :size="24" aria-hidden="true" />
        </div>

        <div class="benefit-list">
          <div>
            <span>상품 할인</span>
            <strong>{{ currentGradeBenefit?.discountRate || 0 }}%</strong>
          </div>
          <div>
            <span>포인트 적립</span>
            <strong>{{ currentGradeBenefit?.pointRate || 0 }}%</strong>
          </div>
          <div>
            <span>무료배송 기준</span>
            <strong>{{ freeShippingText }}</strong>
          </div>
        </div>

        <p class="benefit-note">
          {{ nextGradeMessage }}
        </p>
      </section>

      <section class="surface address-card">
        <div class="card-head">
          <div>
            <span class="section-kicker">기본 배송지</span>
            <h2>배송 정보</h2>
          </div>
          <MapPin :size="24" aria-hidden="true" />
        </div>
        <p v-if="defaultAddressText" class="address-text">
          {{ defaultAddressText }}
        </p>
        <p v-else class="muted-copy">
          아직 기본 배송지가 없습니다. 자주 받는 주소를 저장해두면 주문서에
          자동으로 채워집니다.
        </p>
        <Button to="/account/address" variant="ghost" size="sm">
          배송지 관리
        </Button>
      </section>

      <section class="surface quick-card">
        <div class="card-head">
          <div>
            <span class="section-kicker">빠른 메뉴</span>
            <h2>자주 쓰는 기능</h2>
          </div>
          <UserRound :size="24" aria-hidden="true" />
        </div>
        <div class="quick-list">
          <NuxtLink
            v-for="action in quickActions"
            :key="action.to"
            :to="action.to"
            class="quick-link"
          >
            <component :is="action.icon" :size="19" aria-hidden="true" />
            <span>{{ action.label }}</span>
            <ChevronRight :size="17" aria-hidden="true" />
          </NuxtLink>
        </div>
      </section>

      <section class="surface recent-orders">
        <div class="card-head">
          <div>
            <span class="section-kicker">최근 주문</span>
            <h2>주문 진행 상황</h2>
          </div>
          <Button to="/orders" variant="ghost" size="sm">전체 보기</Button>
        </div>

        <div v-if="recentOrders.length" class="order-summary-list">
          <NuxtLink
            v-for="order in recentOrders"
            :key="order.id"
            to="/orders"
            class="order-summary"
          >
            <div>
              <strong>{{ order.orderNo }}</strong>
              <p>{{ formatDate(order.createdAt) }}</p>
            </div>
            <span>{{ deliveryStatusLabel(order) }}</span>
            <strong>{{ formatCurrency(order.totalAmount) }}</strong>
          </NuxtLink>
        </div>

        <div v-else class="empty-panel">
          <PackageOpen :size="34" aria-hidden="true" />
          <strong>아직 주문 내역이 없습니다.</strong>
          <p>마음에 드는 상품을 담아 첫 주문을 시작해 보세요.</p>
          <Button to="/products" size="sm">상품 보러가기</Button>
        </div>
      </section>

      <section class="surface account-card">
        <div class="card-head">
          <div>
            <span class="section-kicker">계정 관리</span>
            <h2>보안 및 탈퇴</h2>
          </div>
          <ShieldCheck :size="24" aria-hidden="true" />
        </div>
        <p class="muted-copy">
          비밀번호 변경, 성인 인증, 회원탈퇴 같은 민감한 기능은 별도 페이지에서
          한 번 더 확인 후 처리됩니다.
        </p>
        <div class="account-actions">
          <Button to="/account/change-password" variant="ghost" size="sm">
            비밀번호 변경
          </Button>
          <Button
            v-if="!auth.isAdultVerified"
            to="/adult-verification"
            variant="secondary"
            size="sm"
          >
            성인 인증하기
          </Button>
          <Button to="/account/withdraw" variant="danger" size="sm">
            회원탈퇴
          </Button>
          <Button v-if="auth.isAdmin" to="/admin" variant="secondary" size="sm">
            관리자 페이지
          </Button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import {
  ChevronRight,
  Gift,
  KeyRound,
  LogOut,
  MapPin,
  PackageCheck,
  PackageOpen,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  UserRound,
  WalletCards,
} from "@lucide/vue";
import type { Order } from "~/types/domain";
import { formatCurrency, formatDate } from "~/utils/format";

definePageMeta({ middleware: "auth" });

const auth = useAuthStore();
const orderStore = useOrderStore();
const productStore = useProductStore();
const router = useRouter();

const displayName = computed(
  () => auth.profile?.displayName || auth.profile?.loginId || "고객",
);
const myOrders = computed(() => orderStore.myOrders);
const recentOrders = computed(() => myOrders.value.slice(0, 4));
const currentGradeBenefit = computed(() =>
  auth.profile?.userGrade
    ? productStore.findGradeBenefit(auth.profile.userGrade)
    : null,
);
const gradeLabel = computed(
  () => currentGradeBenefit.value?.label || auth.profile?.userGrade || "BASIC",
);
const activeOrderCount = computed(
  () =>
    myOrders.value.filter(
      (order) =>
        order.orderStatus !== "canceled" &&
        order.paymentStatus !== "failed" &&
        order.deliveryStatus !== "delivered" &&
        order.deliveryStatus !== "picked-up",
    ).length,
);
const reviewableItemCount = computed(() =>
  myOrders.value.reduce(
    (total, order) => total + (canWriteReview(order) ? order.items.length : 0),
    0,
  ),
);
const purchaseTotal = computed(
  () =>
    auth.profile?.totalPurchaseAmount ||
    myOrders.value
      .filter((order) => order.paymentStatus === "paid")
      .reduce((total, order) => total + order.totalAmount, 0),
);
const freeShippingText = computed(() => {
  const threshold = currentGradeBenefit.value?.freeShippingThreshold || 0;
  return threshold > 0 ? `${formatCurrency(threshold)} 이상` : "등급 기준 없음";
});
const nextGrade = computed(() => {
  const currentLevel =
    currentGradeBenefit.value?.level || auth.profile?.userGradeLevel || 0;
  return [...productStore.gradeBenefits]
    .filter((grade) => grade.isVisible && grade.level > currentLevel)
    .sort((a, b) => a.level - b.level || a.order - b.order)[0];
});
const nextGradeMessage = computed(() => {
  if (!nextGrade.value) return "현재 적용 가능한 최고 등급 혜택을 받고 있습니다.";
  const gap = Math.max(
    0,
    nextGrade.value.minPurchaseAmount - purchaseTotal.value,
  );
  if (!gap) return `${nextGrade.value.label} 등급 조건을 달성했습니다.`;
  return `${nextGrade.value.label}까지 ${formatCurrency(gap)} 남았습니다.`;
});
const defaultAddressText = computed(() => {
  const address = auth.profile?.defaultAddress;
  if (!address?.address1) return "";
  return `[${address.zipCode || "-"}] ${address.address1} ${address.address2 || ""}`.trim();
});
const summaryMetrics = computed(() => [
  {
    label: "총 주문",
    value: `${myOrders.value.length}건`,
    help: "누적 주문 내역",
    icon: PackageCheck,
  },
  {
    label: "진행중",
    value: `${activeOrderCount.value}건`,
    help: "결제 확인부터 배송 전까지",
    icon: Truck,
  },
  {
    label: "리뷰 가능",
    value: `${reviewableItemCount.value}개`,
    help: "배송 완료 상품 기준",
    icon: Star,
  },
  {
    label: "포인트",
    value: formatCurrency(auth.profile?.availablePoint || 0),
    help: "주문서에서 사용 가능",
    icon: WalletCards,
  },
]);
const quickActions = computed(() => [
  { label: "주문 내역", to: "/orders", icon: PackageCheck },
  { label: "장바구니", to: "/cart", icon: ShoppingBag },
  { label: "배송지 관리", to: "/account/address", icon: MapPin },
  { label: "비밀번호 변경", to: "/account/change-password", icon: KeyRound },
  {
    label: auth.isAdultVerified ? "성인 인증 완료" : "성인 인증",
    to: "/adult-verification",
    icon: ShieldCheck,
  },
]);

const canWriteReview = (order: Order) =>
  order.paymentStatus === "paid" &&
  order.orderStatus !== "canceled" &&
  (order.deliveryStatus === "delivered" ||
    order.deliveryStatus === "picked-up");

const deliveryStatusLabel = (order: Order) => {
  if (order.orderStatus === "canceled") return "주문 취소";
  if (order.claimStatus !== "none") return "처리 요청";
  if (order.paymentStatus !== "paid") return "결제 확인 대기";
  if (order.deliveryStatus === "ready") return "배송 준비중";
  if (order.deliveryStatus === "shipping") return "배송중";
  if (order.deliveryStatus === "delivered") return "배송 완료";
  if (order.deliveryStatus === "pickup-ready") return "픽업 준비 완료";
  if (order.deliveryStatus === "picked-up") return "픽업 완료";
  return order.pickupType === "store-pickup" ? "픽업 준비중" : "배송 준비중";
};

const logout = async () => {
  await auth.signOut();
  await router.push("/");
};

onMounted(async () => {
  await Promise.all([orderStore.hydrate(), productStore.fetchCatalog()]);
});

useHead({ title: "마이페이지" });
</script>

<style scoped>
.mypage-page {
  display: grid;
  min-height: calc(100svh - var(--header-height) - 72px);
  align-content: start;
  gap: 18px;
}

.mypage-head {
  display: grid;
  gap: 16px;
}

.mypage-head h1,
.mypage-head p,
.card-head h2,
.profile-list,
.benefit-note,
.muted-copy,
.address-text,
.order-summary p,
.empty-panel p {
  margin: 0;
}

.mypage-head h1 {
  font-size: clamp(28px, 4vw, 44px);
  line-height: 1.12;
}

.mypage-head > div > p:last-child {
  margin-top: 8px;
  color: var(--color-muted);
  line-height: 1.6;
}

.head-actions,
.account-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.status-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.metric-card,
.profile-card,
.benefit-card,
.address-card,
.quick-card,
.recent-orders,
.account-card {
  padding: 18px;
}

.profile-card {
  padding: 16px;
}

.metric-card {
  display: grid;
  min-height: 134px;
  align-content: start;
  gap: 7px;
}

.metric-card svg,
.card-head svg,
.quick-link svg {
  color: #8d6b28;
}

.metric-card span,
.section-kicker,
.profile-list dt,
.benefit-list span,
.order-summary p,
.muted-copy,
.empty-panel p {
  color: var(--color-muted);
}

.metric-card span,
.section-kicker,
.profile-list dt,
.benefit-list span {
  font-size: 13px;
  font-weight: 900;
}

.metric-card strong {
  font-size: clamp(21px, 3vw, 28px);
  line-height: 1.1;
}

.metric-card small {
  color: var(--color-muted);
  font-size: 12px;
  line-height: 1.45;
}

.mypage-layout {
  display: grid;
  gap: 14px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.card-head h2 {
  margin-top: 4px;
  font-size: 20px;
  line-height: 1.25;
}

.state-pill {
  flex: 0 0 auto;
  border: 1px solid #f1cbc4;
  border-radius: 999px;
  background: #fff7f5;
  padding: 7px 10px;
  color: var(--color-warning);
  font-size: 12px;
  font-weight: 900;
}

.state-pill.verified {
  border-color: #d6e5dc;
  background: #f4faf6;
  color: #497a62;
}

.profile-list {
  display: grid;
  gap: 8px;
}

.profile-list div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--color-line);
  padding-bottom: 8px;
}

.profile-list div:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.profile-list dd {
  margin: 0;
  text-align: right;
  font-weight: 900;
}

.notice-panel {
  display: grid;
  gap: 8px;
  border: 1px solid #f1cbc4;
  border-radius: 8px;
  background: #fff7f5;
  margin-top: 16px;
  padding: 14px;
}

.notice-panel p {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.55;
}

.benefit-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.benefit-list div {
  display: grid;
  gap: 6px;
  border-left: 2px solid var(--color-line);
  padding-left: 10px;
}

.benefit-list strong {
  font-size: 18px;
}

.benefit-note {
  border-radius: 8px;
  background: #fbf8f1;
  margin-top: 16px;
  padding: 12px;
  color: #6a5120;
  font-weight: 900;
  line-height: 1.55;
}

.address-card,
.quick-card,
.account-card {
  display: grid;
  align-content: start;
}

.address-text,
.muted-copy {
  line-height: 1.65;
}

.address-card .ui-button {
  justify-self: start;
  margin-top: 14px;
}

.quick-list {
  display: grid;
  gap: 8px;
}

.quick-link {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-height: 46px;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  padding: 0 12px;
  font-weight: 900;
}

.quick-link:hover {
  border-color: var(--color-accent);
  background: #fbf8f1;
}

.recent-orders {
  display: grid;
  align-content: start;
}

.order-summary-list {
  display: grid;
}

.order-summary {
  display: grid;
  gap: 8px;
  border-top: 1px solid var(--color-line);
  padding: 13px 0;
}

.order-summary:first-child {
  border-top: 0;
  padding-top: 0;
}

.order-summary:last-child {
  padding-bottom: 0;
}

.order-summary span {
  justify-self: start;
  border-radius: 999px;
  background: #fbf8f1;
  padding: 6px 10px;
  color: #6a5120;
  font-size: 12px;
  font-weight: 900;
}

.empty-panel {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 28px 12px;
  text-align: center;
}

.empty-panel svg {
  color: var(--color-muted);
}

@media (min-width: 760px) {
  .mypage-head {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
  }

  .head-actions {
    justify-content: flex-end;
  }

  .status-strip {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .mypage-layout {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .recent-orders {
    grid-column: 1 / -1;
  }

  .order-summary {
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
  }
}

@media (min-width: 1080px) {
  .mypage-layout {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.95fr) minmax(0, 0.9fr);
  }

  .recent-orders {
    grid-column: span 2;
  }
}

@media (max-width: 560px) {
  .status-strip,
  .benefit-list {
    grid-template-columns: 1fr;
  }

  .profile-list div {
    display: grid;
  }

  .profile-list dd {
    text-align: left;
  }
}
</style>
