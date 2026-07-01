import { gradePolicy } from "~/config/catalog";
import type { GradeCode, Product, Role, UserProfile } from "~/types/domain";

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

export const gradeLevel = (grade: GradeCode) => gradePolicy[grade]?.level ?? 0;
export const gradeDiscountRate = (grade: GradeCode) =>
  gradePolicy[grade]?.discountRate ?? 0;

export const hasGradeAtLeast = (
  userGrade: GradeCode | undefined,
  minGrade: GradeCode,
) => gradeLevel(userGrade || "BASIC") >= gradeLevel(minGrade);

export const canViewProduct = (product: Product, user?: UserProfile | null) => {
  if (
    !product.isVisible ||
    product.status === "deleted" ||
    product.status === "hidden"
  )
    return false;
  if (!user)
    return !product.isAdultOnly && product.minUserGradeToView === "BASIC";
  if (product.isAdultOnly && !user.isAdultVerified) return false;
  return hasGradeAtLeast(user.userGrade, product.minUserGradeToView);
};

export const canBuyProduct = (product: Product, user?: UserProfile | null) => {
  if (!canViewProduct(product, user)) return false;
  if (!user) return false;
  if (product.stock <= 0 || product.status === "soldOut") return false;
  if (product.isAdultOnly && !user.isAdultVerified) return false;
  return hasGradeAtLeast(user.userGrade, product.minUserGradeToBuy);
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
) => {
  if (!user) return product.basePrice;
  const gradePrice = product.gradePrices?.[user.userGrade];
  if (typeof gradePrice === "number" && gradePrice > 0) return gradePrice;
  const memberBase = product.memberPrice || product.basePrice;
  const discounted = Math.round(
    memberBase * (1 - gradeDiscountRate(user.userGrade) / 100),
  );
  return Math.max(0, Math.min(memberBase, discounted));
};

export const discountRate = (product: Product, user?: UserProfile | null) => {
  if (!product.compareAtPrice) return 0;
  const price = currentUnitPrice(product, user);
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
