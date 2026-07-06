import { getFirebaseAdmin } from "~/server/utils/firebase-admin";
import type { Product } from "~/types/domain";

const PUBLIC_ACCESS_GRADE = "PUBLIC";

const toJsonValue = (value: unknown): unknown => {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) return value.map((item) => toJsonValue(item));

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, toJsonValue(item)]),
    );
  }

  return value;
};

const isPublicGrade = (grade?: unknown) =>
  !grade || grade === PUBLIC_ACCESS_GRADE;

const publicCategoryGrade = (category: Record<string, unknown>) =>
  category.displayMinUserGradeToView ||
  category.minUserGradeToView ||
  PUBLIC_ACCESS_GRADE;

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");

  const slug = getRouterParam(event, "slug") || "";
  if (!slug) return null;

  const admin = getFirebaseAdmin();
  if (!admin) return null;

  const snap = await admin.db
    .collection("products")
    .where("slug", "==", slug)
    .where("isVisible", "==", true)
    .where("status", "==", "active")
    .limit(1)
    .get();
  const doc = snap.docs[0];
  if (!doc) return null;

  const product = toJsonValue(doc.data()) as Product;
  if (!isPublicGrade(product.minUserGradeToView)) return null;

  const categoryIds = Array.isArray(product.categoryIds)
    ? product.categoryIds
    : [];
  if (categoryIds.length) {
    const categorySnap = await admin.db
      .collection("categories")
      .where("isVisible", "==", true)
      .get();
    const publicCategoryIds = new Set(
      categorySnap.docs
        .map((item) => ({
          id: item.id,
          ...(toJsonValue(item.data()) as Record<string, unknown>),
        }))
        .filter((category) => isPublicGrade(publicCategoryGrade(category)))
        .map((category) => category.id),
    );

    if (!categoryIds.some((categoryId) => publicCategoryIds.has(categoryId)))
      return null;
  }

  return {
    ...product,
    id: doc.id,
  } satisfies Product;
});
