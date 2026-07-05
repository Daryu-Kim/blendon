import { gradePolicy } from "~/config/catalog";
import type {
  AccessGradeCode,
  GradeBenefit,
  GradeCode,
  Category,
  Product,
  Role,
  UserProfile,
} from "~/types/domain";

export const adminRoles: Role[] = ["manager", "admin", "owner"];

export const roleRank: Record<Role, number> = {
  customer: 0,
  staff: 1,
  manager: 2,
  admin: 3,
  owner: 4,
};

export const hasAdminAccess = (user?: Pick<UserProfile, "role"> | null) =>
  Boolean(user && adminRoles.includes(user.role));

export const hasRoleAtLeast = (
  user: Pick<UserProfile, "role"> | null | undefined,
  role: Role,
) => Boolean(user && roleRank[user.role] >= roleRank[role]);

export const PUBLIC_ACCESS_GRADE = "PUBLIC" as const;

export const isPublicAccessGrade = (grade?: AccessGradeCode | null) =>
  !grade || grade === PUBLIC_ACCESS_GRADE;

const findGrade = (grade: GradeCode | undefined, grades: GradeBenefit[] = []) =>
  grades.find(
    (item) =>
      item.gradeCode === grade || item.id === grade || item.internalCode === grade,
  );

const numericGradeLevel = (grade?: string) => {
  const matched = /^(?:G|LEVEL_)(\d+)$/.exec(grade || "");
  return matched ? Number(matched[1]) : 0;
};

export const gradeLevel = (
  grade: AccessGradeCode | undefined,
  grades: GradeBenefit[] = [],
) => {
  if (isPublicAccessGrade(grade)) return 0;
  return (
    findGrade(grade, grades)?.level ??
    gradePolicy[grade || ""]?.level ??
    numericGradeLevel(grade) ??
    0
  );
};

export const gradeDiscountRate = (
  grade: GradeCode | undefined,
  grades: GradeBenefit[] = [],
) =>
  findGrade(grade, grades)?.discountRate ??
  gradePolicy[grade || ""]?.discountRate ??
  0;

export const hasGradeAtLeast = (
  userGrade: GradeCode | undefined,
  minGrade: AccessGradeCode,
  grades: GradeBenefit[] = [],
) => {
  if (isPublicAccessGrade(minGrade)) return true;
  return gradeLevel(userGrade || "BASIC", grades) >= gradeLevel(minGrade, grades);
};

export const categoryDisplayGrade = (category: Category) =>
  category.displayMinUserGradeToView || PUBLIC_ACCESS_GRADE;

const categoryDisplayGradeLevel = (
  category: Category,
  grades: GradeBenefit[] = [],
) =>
  Number(category.displayMinUserGradeLevel ?? 0) ||
  gradeLevel(categoryDisplayGrade(category), grades);

export const canViewProduct = (
  product: Product,
  user?: UserProfile | null,
  grades: GradeBenefit[] = [],
) => {
  if (
    !product.isVisible ||
    product.status === "deleted" ||
    product.status === "hidden"
  )
    return false;
  if (!user) return isPublicAccessGrade(product.minUserGradeToView);
  if (
    product.isAdultOnly &&
    !user.isAdultVerified &&
    !isPublicAccessGrade(product.minUserGradeToView)
  )
    return false;
  return hasGradeAtLeast(user.userGrade, product.minUserGradeToView, grades);
};

export const canViewCategory = (
  category: Category,
  user?: UserProfile | null,
  grades: GradeBenefit[] = [],
) => {
  if (!category.isVisible) return false;
  const minDisplayGrade = categoryDisplayGrade(category);
  if (!user) return isPublicAccessGrade(minDisplayGrade);
  return (
    gradeLevel(user.userGrade || "BASIC", grades) >=
    categoryDisplayGradeLevel(category, grades)
  );
};

export const canViewProductWithCategories = (
  product: Product,
  categories: Category[] = [],
  user?: UserProfile | null,
  grades: GradeBenefit[] = [],
) => {
  if (!canViewProduct(product, user, grades)) return false;
  if (!product.categoryIds.length) return true;
  const accessibleCategoryIds = new Set(
    categories
      .filter((category) => canViewCategory(category, user, grades))
      .map((category) => category.id),
  );
  return product.categoryIds.some((categoryId) =>
    accessibleCategoryIds.has(categoryId),
  );
};

export const canBuyProduct = (
  product: Product,
  user?: UserProfile | null,
  grades: GradeBenefit[] = [],
) => {
  if (!canViewProduct(product, user, grades)) return false;
  if (!user) return false;
  if (product.stock <= 0 || product.status === "soldOut") return false;
  if (product.isAdultOnly && !user.isAdultVerified) return false;
  return hasGradeAtLeast(user.userGrade, product.minUserGradeToBuy, grades);
};

export const shouldHidePrice = (
  product: Product,
  user?: UserProfile | null,
) => {
  if (!user && product.isPriceHiddenBeforeLogin) return true;
  if (
    product.isPriceHiddenBeforeAdultVerification &&
    (!user || !user.isAdultVerified)
  )
    return true;
  if (product.isAdultOnly && (!user || !user.isAdultVerified)) return true;
  return false;
};

export const currentUnitPrice = (
  product: Product,
  user?: UserProfile | null,
  grades: GradeBenefit[] = [],
) => {
  if (!user) return product.basePrice;
  if (product.isGradeDiscountExcluded)
    return product.memberPrice || product.basePrice;
  const gradePrice = product.gradePrices?.[user.userGrade];
  if (typeof gradePrice === "number" && gradePrice > 0) return gradePrice;
  const memberBase = product.memberPrice || product.basePrice;
  const discounted = Math.round(
    memberBase * (1 - gradeDiscountRate(user.userGrade, grades) / 100),
  );
  return Math.max(0, Math.min(memberBase, discounted));
};

export const regularMemberUnitPrice = (product: Product) =>
  product.memberPrice || product.basePrice;

export const gradeDiscountAmount = (
  product: Product,
  user?: UserProfile | null,
  grades: GradeBenefit[] = [],
) => {
  if (!user || product.isGradeDiscountExcluded) return 0;
  return Math.max(
    0,
    regularMemberUnitPrice(product) - currentUnitPrice(product, user, grades),
  );
};

export const discountRate = (
  product: Product,
  user?: UserProfile | null,
  grades: GradeBenefit[] = [],
) => {
  if (!product.compareAtPrice) return 0;
  const price = currentUnitPrice(product, user, grades);
  return Math.max(
    0,
    Math.round(
      ((product.compareAtPrice - price) / product.compareAtPrice) * 100,
    ),
  );
};

export const maskRestrictedText = (
  product: Product,
  user?: UserProfile | null,
) => {
  if (product.isAdultOnly && (!user || !user.isAdultVerified)) {
    return "성인 인증 완료 회원만 상세 안내를 확인할 수 있는 상품입니다.";
  }
  return product.description;
};
