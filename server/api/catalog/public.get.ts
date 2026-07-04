import { getFirebaseAdmin } from "~/server/utils/firebase-admin";

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

const docToJson = <T extends Record<string, unknown>>(
  id: string,
  data: T,
): Record<string, unknown> & { id: string } => ({
  id,
  ...(toJsonValue(data) as Record<string, unknown>),
});

const isPublicGrade = (grade?: unknown) => !grade || grade === PUBLIC_ACCESS_GRADE;

const publicCategoryGrade = (category: Record<string, unknown>) =>
  category.displayMinUserGradeToView ||
  category.minUserGradeToView ||
  PUBLIC_ACCESS_GRADE;

export default defineEventHandler(async () => {
  const admin = getFirebaseAdmin();
  if (!admin) {
    throw createError({
      statusCode: 503,
      statusMessage: "Firebase Admin 설정이 필요합니다.",
    });
  }

  const [categorySnap, productSnap, gradeSnap] = await Promise.all([
    admin.db.collection("categories").where("isVisible", "==", true).get(),
    admin.db
      .collection("products")
      .where("isVisible", "==", true)
      .where("status", "==", "active")
      .get(),
    admin.db.collection("gradeBenefits").orderBy("order", "asc").get(),
  ]);

  const categories = categorySnap.docs
    .map((doc) => docToJson(doc.id, doc.data()))
    .filter((category) => isPublicGrade(publicCategoryGrade(category)))
    .sort(
      (a, b) =>
        Number(a.order || 0) - Number(b.order || 0) ||
        Number(a.depth || 1) - Number(b.depth || 1) ||
        String(a.name || "").localeCompare(String(b.name || "")),
    );

  const publicCategoryIds = new Set(categories.map((category) => category.id));
  const products = productSnap.docs
    .map((doc) => docToJson(doc.id, doc.data()))
    .filter((product) => {
      const minGrade = product.minUserGradeToView || PUBLIC_ACCESS_GRADE;
      const categoryIds: unknown[] = Array.isArray(product.categoryIds)
        ? product.categoryIds
        : [];
      return (
        isPublicGrade(minGrade) &&
        (!categoryIds.length ||
          categoryIds.some((categoryId) =>
            publicCategoryIds.has(String(categoryId)),
          ))
      );
    })
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

  const gradeBenefits = gradeSnap.docs.map((doc) => docToJson(doc.id, doc.data()));

  return {
    products,
    categories,
    gradeBenefits,
  };
});
