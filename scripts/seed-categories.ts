import { readFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import type { Category } from "~/types/domain";

type CategoryNode = {
  name: string;
  children?: CategoryNode[];
};

const readEnvValue = (key: string) => {
  if (process.env[key]) return process.env[key];
  try {
    const env = readFileSync(".env", "utf8");
    const line = env
      .split(/\r?\n/)
      .find((item) => item.trim().startsWith(`${key}=`));
    return line?.slice(key.length + 1).trim();
  } catch {
    return undefined;
  }
};

const serviceAccountJson = readEnvValue("FIREBASE_SERVICE_ACCOUNT_JSON");

if (!serviceAccountJson) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is required.");
}

initializeApp({
  credential: cert(JSON.parse(serviceAccountJson)),
});

const db = getFirestore();

const tree: CategoryNode[] = [
  {
    name: "베스트",
    children: [
      { name: "전체" },
      { name: "기기" },
      { name: "액상" },
      { name: "팟·코일" },
      { name: "재구매" },
    ],
  },
  {
    name: "신상품",
    children: [
      { name: "전체" },
      { name: "기기" },
      { name: "액상" },
      { name: "팟·코일" },
      { name: "입고예정" },
    ],
  },
  {
    name: "기기",
    children: [
      {
        name: "입호흡 기기",
        children: [
          { name: "전체" },
          { name: "입문용" },
          { name: "팟디바이스" },
          { name: "컴팩트형" },
          { name: "프리미엄" },
        ],
      },
      {
        name: "폐호흡 기기",
        children: [
          { name: "전체" },
          { name: "입문용" },
          { name: "모드기기" },
          { name: "탱크세트" },
          { name: "고출력" },
        ],
      },
      {
        name: "일회용 기기",
        children: [
          { name: "전체" },
          { name: "무니코틴" },
          { name: "대체 니코틴" },
          { name: "회원전용" },
        ],
      },
    ],
  },
  {
    name: "액상",
    children: [
      {
        name: "무니코틴",
        children: [
          {
            name: "입호흡",
            children: [
              { name: "전체" },
              { name: "과일" },
              { name: "멘솔" },
              { name: "디저트" },
              { name: "음료" },
              { name: "타바코" },
              { name: "심플" },
            ],
          },
          {
            name: "폐호흡",
            children: [
              { name: "전체" },
              { name: "과일" },
              { name: "멘솔" },
              { name: "디저트" },
              { name: "음료" },
              { name: "타바코" },
              { name: "심플" },
            ],
          },
        ],
      },
      {
        name: "대체 니코틴",
        children: [
          {
            name: "입호흡",
            children: [
              { name: "전체" },
              { name: "과일" },
              { name: "멘솔" },
              { name: "디저트" },
              { name: "음료" },
              { name: "타바코" },
              { name: "심플" },
            ],
          },
          {
            name: "폐호흡",
            children: [
              { name: "전체" },
              { name: "과일" },
              { name: "멘솔" },
              { name: "디저트" },
              { name: "음료" },
              { name: "타바코" },
              { name: "심플" },
            ],
          },
        ],
      },
      {
        name: "합성 니코틴",
        children: [
          {
            name: "입호흡",
            children: [
              { name: "전체" },
              { name: "과일" },
              { name: "멘솔" },
              { name: "디저트" },
              { name: "음료" },
              { name: "타바코" },
              { name: "심플" },
            ],
          },
          {
            name: "폐호흡",
            children: [
              { name: "전체" },
              { name: "과일" },
              { name: "멘솔" },
              { name: "디저트" },
              { name: "음료" },
              { name: "타바코" },
              { name: "심플" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "팟·코일",
    children: [
      {
        name: "팟",
        children: [
          { name: "전체" },
          { name: "입호흡" },
          { name: "폐호흡" },
          { name: "브랜드별" },
        ],
      },
      {
        name: "코일",
        children: [
          { name: "전체" },
          { name: "입호흡" },
          { name: "폐호흡" },
          { name: "저항값별" },
        ],
      },
      { name: "카트리지" },
      { name: "탱크" },
      { name: "드립팁" },
    ],
  },
  {
    name: "액세서리",
    children: [
      { name: "충전기" },
      { name: "케이블" },
      { name: "배터리" },
      { name: "케이스" },
      { name: "파우치" },
      { name: "관리용품" },
    ],
  },
  {
    name: "입문추천",
    children: [
      { name: "처음이라면" },
      { name: "입호흡 입문" },
      { name: "폐호흡 입문" },
      { name: "무니코틴 입문" },
      { name: "관리 쉬운 조합" },
      { name: "자주 찾는 세트" },
    ],
  },
  {
    name: "세트",
    children: [
      { name: "기기 + 액상" },
      { name: "기기 + 팟" },
      { name: "무니코틴 세트" },
      { name: "입문 세트" },
      { name: "재구매 세트" },
    ],
  },
  {
    name: "브랜드",
    children: [
      { name: "기기 브랜드" },
      { name: "액상 브랜드" },
      { name: "팟·코일 브랜드" },
      { name: "추천 브랜드" },
    ],
  },
];

const segmentSlugs: Record<string, string> = {
  베스트: "best",
  신상품: "new",
  기기: "devices",
  액상: "liquids",
  "팟·코일": "pods-coils",
  재구매: "reorder",
  입고예정: "coming-soon",
  "입호흡 기기": "mtl-devices",
  "폐호흡 기기": "dtl-devices",
  "일회용 기기": "disposable-devices",
  전체: "all",
  입문용: "starter",
  팟디바이스: "pod-devices",
  컴팩트형: "compact",
  프리미엄: "premium",
  모드기기: "mod-devices",
  탱크세트: "tank-set",
  고출력: "high-power",
  무니코틴: "nicotine-free",
  "대체 니코틴": "alternative-nicotine",
  회원전용: "members-only",
  입호흡: "mtl",
  폐호흡: "dtl",
  과일: "fruit",
  멘솔: "menthol",
  디저트: "dessert",
  음료: "beverage",
  타바코: "tobacco",
  심플: "simple",
  "합성 니코틴": "synthetic-nicotine",
  팟: "pods",
  코일: "coils",
  브랜드별: "by-brand",
  저항값별: "by-resistance",
  카트리지: "cartridges",
  탱크: "tanks",
  드립팁: "drip-tips",
  액세서리: "accessories",
  충전기: "chargers",
  케이블: "cables",
  배터리: "batteries",
  케이스: "cases",
  파우치: "pouches",
  관리용품: "maintenance",
  입문추천: "starter-guide",
  처음이라면: "first-time",
  "입호흡 입문": "mtl-starter",
  "폐호흡 입문": "dtl-starter",
  "무니코틴 입문": "nicotine-free-starter",
  "관리 쉬운 조합": "easy-care",
  "자주 찾는 세트": "popular-sets",
  세트: "sets",
  "기기 + 액상": "device-liquid",
  "기기 + 팟": "device-pod",
  "무니코틴 세트": "nicotine-free-set",
  "입문 세트": "starter-set",
  "재구매 세트": "reorder-set",
  브랜드: "brands",
  "기기 브랜드": "device-brands",
  "액상 브랜드": "liquid-brands",
  "팟·코일 브랜드": "pods-coils-brands",
  "추천 브랜드": "recommended-brands",
};

const toSegment = (name: string) => {
  const mapped = segmentSlugs[name];
  if (!mapped) throw new Error(`Missing slug segment for category: ${name}`);
  return mapped;
};

const flattenTree = (
  nodes: CategoryNode[],
  parentId: string | null = null,
  parentSegments: string[] = [],
  parentNames: string[] = [],
): Category[] =>
  nodes.flatMap((node, index) => {
    const segments = [...parentSegments, toSegment(node.name)];
    const names = [...parentNames, node.name];
    const slug = segments.join("-");
    const isSynthetic = names.includes("합성 니코틴");
    const category: Category = {
      id: slug,
      name: node.name,
      slug,
      parentId,
      depth: segments.length,
      order: index + 1,
      isVisible: true,
      minUserGradeToView: isSynthetic ? "LEVEL_7" : "LEVEL_1",
      minUserGradeLevel: isSynthetic ? 7 : 1,
      displayMinUserGradeToView: isSynthetic ? "LEVEL_7" : "PUBLIC",
      displayMinUserGradeLevel: isSynthetic ? 7 : 0,
      adultOnly: true,
    };

    return [
      category,
      ...flattenTree(node.children || [], slug, segments, names),
    ];
  });

const chunk = <T>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );

const deleteExistingCategories = async () => {
  const snap = await db.collection("categories").get();
  for (const docs of chunk(snap.docs, 450)) {
    const batch = db.batch();
    docs.forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
  return snap.size;
};

const seedCategories = async (categories: Category[]) => {
  for (const items of chunk(categories, 450)) {
    const batch = db.batch();
    items.forEach((category) => {
      batch.set(db.collection("categories").doc(category.id), {
        ...category,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }
};

const categories = flattenTree(tree);
const deletedCount = await deleteExistingCategories();
await seedCategories(categories);

console.log(
  `Replaced categories: deleted ${deletedCount}, inserted ${categories.length}.`,
);
