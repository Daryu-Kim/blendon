<template>
  <aside class="admin-sidebar">
    <NuxtLink class="admin-logo" to="/admin">{{ brand.name }} Admin</NuxtLink>
    <nav>
      <NuxtLink v-for="item in items" :key="item.to" :to="item.to">
        <component :is="item.icon" :size="18" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import {
  Boxes,
  LayoutDashboard,
  Megaphone,
  Package,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "@lucide/vue";

const { brand } = useAppConfig();
const items = [
  { to: "/admin", label: "대시보드", icon: LayoutDashboard },
  { to: "/admin/products", label: "상품 관리", icon: Package },
  { to: "/admin/orders", label: "주문 관리", icon: ShoppingCart },
  { to: "/admin/members", label: "회원 관리", icon: Users },
  { to: "/admin/grades", label: "회원 등급", icon: ShieldCheck },
  { to: "/admin/categories", label: "카테고리", icon: Boxes },
  { to: "/admin/banners", label: "배너/콘텐츠", icon: Megaphone },
];
</script>

<style scoped>
.admin-sidebar {
  display: grid;
  gap: 16px;
  align-content: start;
  border-right: 1px solid var(--color-line);
  background: #fff;
  padding: 18px;
}

.admin-logo {
  font-weight: 900;
}

nav {
  display: grid;
  gap: 8px;
}

nav a {
  display: flex;
  min-height: 40px;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  padding: 0 10px;
  font-weight: 800;
}

nav a.router-link-active {
  background: var(--color-background);
}
</style>
