import type { Category } from "~/types/domain";

export const buildCategoryTree = (categories: Category[]) => {
  const byParent = new Map<string, Category[]>();
  categories.forEach((category) => {
    const key = category.parentId || "__root__";
    byParent.set(key, [...(byParent.get(key) || []), category]);
  });

  const sortItems = (items: Category[]) =>
    [...items].sort(
      (a, b) =>
        a.order - b.order || a.depth - b.depth || a.name.localeCompare(b.name),
    );

  const result: Category[] = [];
  const append = (parentId = "__root__") => {
    sortItems(byParent.get(parentId) || []).forEach((category) => {
      result.push(category);
      append(category.id);
    });
  };

  append();
  return result;
};
