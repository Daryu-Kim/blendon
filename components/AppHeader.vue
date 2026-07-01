<template>
  <header class="app-header">
    <div class="top-strip">
      <div class="page-shell top-strip-inner">
        <p>
          회원가입 시 확인된 성인 회원만 성인 전용 카테고리를 이용할 수 있어요.
        </p>
        <nav aria-label="상단 빠른 메뉴">
          <NuxtLink to="/notices">공지사항</NuxtLink>
          <NuxtLink to="/guide">이용안내</NuxtLink>
          <NuxtLink to="/support">고객센터</NuxtLink>
        </nav>
      </div>
    </div>

    <div class="header-inner page-shell">
      <NuxtLink class="logo" to="/" :aria-label="`${brand.name} 홈`">
        <span>{{ brand.name }}</span>
        <small>{{ brand.koName }}</small>
      </NuxtLink>

      <div class="search-wrap">
        <SearchBar />
      </div>

      <nav class="header-actions" aria-label="사용자 메뉴">
        <NuxtLink
          v-if="auth.isLoggedIn"
          class="icon-link"
          to="/mypage"
          title="마이페이지"
        >
          <User :size="20" />
          <span>MY</span>
        </NuxtLink>
        <NuxtLink v-else class="icon-link" to="/login" title="로그인">
          <LogIn :size="20" />
          <span>로그인</span>
        </NuxtLink>
        <NuxtLink class="icon-link cart-link" to="/cart" title="장바구니">
          <ShoppingBag :size="20" />
          <span>{{ cart.count }}</span>
        </NuxtLink>
      </nav>
    </div>
    <div class="nav-band">
      <div class="page-shell nav-row">
        <CategoryNav />
        <NuxtLink class="nav-promo" to="/products?category=lounge-pick"
          >라운지 픽</NuxtLink
        >
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { LogIn, ShoppingBag, User } from "@lucide/vue";

const { brand } = useAppConfig();
const auth = useAuthStore();
const cart = useCartStore();

onMounted(async () => {
  await auth.init();
  cart.hydrate();
});
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid var(--color-line);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
}

.top-strip {
  background: var(--color-primary);
  color: #fff;
}

.top-strip-inner {
  display: flex;
  min-height: 34px;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.top-strip p {
  margin: 0;
  overflow: hidden;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-strip nav {
  display: none;
  gap: 14px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.header-inner {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 14px 0 12px;
}

.logo {
  display: grid;
  gap: 3px;
  font-weight: 900;
  line-height: 1;
}

.logo span {
  font-size: 23px;
  letter-spacing: 0;
}

.logo small {
  color: var(--color-muted);
  font-size: 12px;
}

.search-wrap {
  grid-column: 1 / -1;
  order: 3;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: end;
  gap: 6px;
}

.icon-link {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid #eee4d4;
  border-radius: 999px;
  background: #fff;
  padding: 0 11px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.icon-link span {
  display: none;
}

.cart-link span {
  display: inline;
  min-width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-accent);
  text-align: center;
  line-height: 18px;
}

.nav-band {
  border-top: 1px solid var(--color-line);
  background: #fff;
}

.nav-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.nav-promo {
  display: none;
  min-height: 34px;
  align-items: center;
  border-radius: 999px;
  background: var(--color-secondary-accent);
  padding: 0 13px;
  color: #fff;
  font-size: 13px;
  font-weight: 900;
}

@media (min-width: 860px) {
  .top-strip nav {
    display: flex;
  }

  .header-inner {
    grid-template-columns: 210px minmax(340px, 1fr) auto;
    padding: 20px 0;
  }

  .search-wrap {
    grid-column: auto;
    order: 0;
  }

  .icon-link span {
    display: inline;
  }

  .nav-promo {
    display: inline-flex;
  }
}
</style>
