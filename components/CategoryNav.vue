<template>
  <nav class="category-nav" aria-label="상품 카테고리">
    <NuxtLink class="nav-link" to="/products" :class="{ active: !activeCategoryId }"
      >전체</NuxtLink
    >
    <div
      v-for="category in categoryTree"
      :key="category.id"
      class="nav-item"
    >
      <NuxtLink
        class="nav-link"
        :to="categoryTo(category)"
        :class="{ active: isActiveTree(category) }"
      >
        {{ category.name }}
      </NuxtLink>
      <div v-if="category.children.length" class="dropdown" role="menu">
        <div
          v-for="child in category.children"
          :key="child.id"
          class="dropdown-group"
        >
          <NuxtLink
            class="dropdown-link parent"
            :to="categoryTo(child)"
            :class="{ active: isActiveTree(child) }"
          >
            {{ child.name }}
          </NuxtLink>
          <div v-if="child.children.length" class="sub-links">
            <NuxtLink
              v-for="grandchild in child.children"
              :key="grandchild.id"
              class="dropdown-link"
              :to="categoryTo(grandchild)"
              :class="{ active: activeCategoryId === grandchild.id }"
            >
              {{ grandchild.name }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import type { Category } from "~/types/domain";

type NavCategory = Category & { children: NavCategory[] };

const productStore = useProductStore();
const route = useRoute();
const activeCategoryId = computed(() =>
  route.path === "/products"
    ? productStore.findCategoryBySlugOrId(String(route.query.category || ""))
        ?.id || ""
    : "",
);

const categoryTo = (category: Category) => ({
  path: "/products",
  query: { category: productStore.categoryRouteValue(category) },
});

const sortCategories = (categories: NavCategory[]) =>
  categories.sort(
    (a, b) => a.order - b.order || a.depth - b.depth || a.name.localeCompare(b.name),
  );

const categoryTree = computed(() => {
  const map = new Map<string, NavCategory>();
  productStore.visibleCategories.forEach((category) => {
    map.set(category.id, { ...category, children: [] });
  });

  const roots: NavCategory[] = [];
  map.forEach((category) => {
    if (category.parentId && map.has(category.parentId)) {
      map.get(category.parentId)?.children.push(category);
    } else {
      roots.push(category);
    }
  });

  map.forEach((category) => sortCategories(category.children));
  return sortCategories(roots);
});

const isActiveTree = (category: NavCategory): boolean =>
  activeCategoryId.value === category.id ||
  category.children.some((child) => isActiveTree(child));
</script>

<style scoped>
.category-nav {
  display: flex;
  gap: 16px;
  overflow: visible;
  padding: 0;
}

.nav-item {
  position: relative;
  flex: 0 0 auto;
}

.nav-link {
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  padding: 0 2px;
  font-size: 14px;
  font-weight: 900;
  white-space: nowrap;
}

.nav-link::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  background: transparent;
  content: "";
}

.nav-link:hover,
.nav-link.active {
  color: #8d6b28;
}

.nav-link:hover::after,
.nav-link.active::after {
  background: var(--color-primary);
}

.dropdown {
  position: absolute;
  top: calc(100% - 1px);
  left: 0;
  z-index: 30;
  display: none;
  min-width: 220px;
  gap: 8px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  padding: 12px;
  box-shadow: 0 18px 38px rgba(23, 23, 23, 0.12);
}

.nav-item:hover .dropdown,
.nav-item:focus-within .dropdown {
  display: grid;
}

.dropdown-group {
  display: grid;
  gap: 6px;
}

.dropdown-link {
  display: flex;
  min-height: 34px;
  align-items: center;
  border-radius: 7px;
  padding: 0 10px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

.dropdown-link:hover,
.dropdown-link.active {
  background: #f7f3ea;
  color: #8d6b28;
}

.dropdown-link.parent {
  font-weight: 900;
}

.sub-links {
  display: grid;
  gap: 4px;
  border-left: 1px solid var(--color-line);
  margin-left: 10px;
  padding-left: 8px;
}
</style>
