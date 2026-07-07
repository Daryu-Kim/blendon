import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

initializeApp();

const db = getFirestore();

const adminRoles = ["manager", "admin", "owner"];

interface GradeBenefitDoc {
  id: string;
  gradeCode?: string;
  level?: number;
  minPurchaseAmount?: number;
}

const GRADE_EVALUATION_MONTHS = 6;

const requireAuth = (request: {
  auth?: { uid: string; token: Record<string, unknown> };
}) => {
  if (!request.auth)
    throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  return request.auth;
};

const requireAdmin = (request: {
  auth?: { uid: string; token: Record<string, unknown> };
}) => {
  const auth = requireAuth(request);
  if (!adminRoles.includes(String(auth.token.role || "customer"))) {
    throw new HttpsError("permission-denied", "관리자 권한이 필요합니다.");
  }
  return auth;
};

const gradeLevel = (grade: GradeBenefitDoc) => Number(grade.level || 1);

const toMillis = (value: unknown) => {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }
  if (typeof value === "string") return new Date(value).getTime();
  return 0;
};

const calculateRecentConfirmedAmount = async (
  userId: string,
  since: Date,
) => {
  const snap = await db
    .collection("orders")
    .where("userId", "==", userId)
    .where("paymentStatus", "==", "paid")
    .get();
  const sinceTime = since.getTime();
  return snap.docs.reduce((sum, doc) => {
    const order = doc.data();
    if (order.orderStatus !== "completed") return sum;
    const basisTime = toMillis(order.completedAt || order.updatedAt || order.paidAt);
    if (basisTime < sinceTime) return sum;
    return sum + Number(order.totalAmount || 0);
  }, 0);
};

export const refreshMonthlyUserGrades = onSchedule(
  {
    schedule: "0 3 1 * *",
    timeZone: "Asia/Seoul",
  },
  async () => {
    const gradeSnap = await db
      .collection("gradeBenefits")
      .where("isVisible", "==", true)
      .get();
    const grades = gradeSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as GradeBenefitDoc)
      .sort((a, b) => gradeLevel(b) - gradeLevel(a));
    if (!grades.length) return;

    const since = new Date();
    since.setMonth(since.getMonth() - GRADE_EVALUATION_MONTHS);

    const userSnap = await db
      .collection("users")
      .where("role", "==", "customer")
      .get();
    const batch = db.batch();
    const now = FieldValue.serverTimestamp();

    for (const userDoc of userSnap.docs) {
      if (userDoc.data().isGradeLocked === true) continue;

      const amount = await calculateRecentConfirmedAmount(userDoc.id, since);
      const nextGrade =
        grades.find(
          (grade) => amount >= Number(grade.minPurchaseAmount || 0),
        ) || grades[grades.length - 1];

      batch.set(
        userDoc.ref,
        {
          userGrade: String(nextGrade.gradeCode || nextGrade.id),
          userGradeLevel: gradeLevel(nextGrade),
          gradeEvaluatedAt: now,
          gradePurchaseAmount6Months: amount,
          updatedAt: now,
        },
        { merge: true },
      );
    }

    await batch.commit();
  },
);

export const setInitialAdminClaim = onCall(async (request) => {
  requireAdmin(request);
  const email = String(
    request.data?.email || process.env.ADMIN_INITIAL_EMAIL || "",
  );
  if (!email)
    throw new HttpsError("invalid-argument", "관리자 이메일이 필요합니다.");
  const user = await getAuth().getUserByEmail(email);
  await getAuth().setCustomUserClaims(user.uid, { role: "admin" });
  await db
    .collection("users")
    .doc(user.uid)
    .set(
      { role: "admin", updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  return { ok: true, uid: user.uid };
});
