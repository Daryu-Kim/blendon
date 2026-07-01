import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!serviceAccountJson) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is required for seeding.");
}

initializeApp({
  credential: cert(JSON.parse(serviceAccountJson)),
});

const db = getFirestore();
const now = new Date().toISOString();

const products = [
  {
    id: "product-blend-device-one",
    name: "Blend Device One",
    slug: "blend-device-one",
    shortDescription: "처음 고르기 쉬운 컴팩트 디바이스",
    description:
      "간결한 조작감과 안정적인 휴대성을 기준으로 구성한 입문형 디바이스입니다.",
    categoryIds: ["device", "device-starter", "starter-pick"],
    brandName: "Blend Studio",
    thumbnailUrl: "",
    imageUrls: [],
    basePrice: 52000,
    memberPrice: 49000,
    compareAtPrice: 59000,
    stock: 18,
    options: [
      {
        optionId: "black",
        optionName: "Charcoal Black",
        optionCode: "BDO-BK",
        additionalPrice: 0,
        stock: 10,
        isActive: true,
      },
    ],
    badges: ["입문 추천", "회원가"],
    tags: ["컴팩트", "데일리"],
    flavorProfile: {
      sweetness: 0,
      coolness: 0,
      body: 3,
      mood: ["daily"],
      notes: ["device"],
    },
    deviceType: "starter",
    nicotineType: "not-applicable",
    isNicotineFree: false,
    isAlternativeNicotine: false,
    isAdultOnly: false,
    isVisible: true,
    minUserGradeToView: "BASIC",
    minUserGradeToBuy: "BASIC",
    isPriceHiddenBeforeLogin: true,
    isPriceHiddenBeforeAdultVerification: false,
    status: "active",
    createdAt: now,
    updatedAt: now,
  },
];

const categories = [
  {
    id: "device",
    name: "디바이스",
    slug: "device",
    parentId: null,
    depth: 1,
    order: 1,
    isVisible: true,
    minUserGradeToView: "BASIC",
    adultOnly: false,
  },
  {
    id: "nicotine-free",
    name: "니코틴 프리",
    slug: "nicotine-free",
    parentId: null,
    depth: 1,
    order: 3,
    isVisible: true,
    minUserGradeToView: "BASIC",
    adultOnly: false,
  },
  {
    id: "adult-only",
    name: "성인 전용",
    slug: "adult-only",
    parentId: null,
    depth: 1,
    order: 4,
    isVisible: true,
    minUserGradeToView: "PLUS",
    adultOnly: true,
  },
];

await Promise.all([
  ...products.map((product) =>
    db.collection("products").doc(product.id).set(product, { merge: true }),
  ),
  ...categories.map((category) =>
    db.collection("categories").doc(category.id).set(category, { merge: true }),
  ),
]);

console.log(
  `Seeded ${products.length} products and ${categories.length} categories.`,
);
