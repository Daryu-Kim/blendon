import { requireAdmin } from "~/server/utils/admin-auth";
import type { DeviceType, NicotineType } from "~/types/domain";

type KeywordMode = "seo" | "tag";

interface KeywordRequestBody {
  mode: KeywordMode;
  product: {
    name: string;
    shortDescription: string;
    description: string;
    brandName: string;
    categoryNames: string[];
    deviceType: DeviceType;
    nicotineType: NicotineType;
    badges: string[];
    tags: string[];
  };
}

const plainText = (value: string) =>
  value
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/[#>*_`~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);

const buildInstructions = (mode: KeywordMode) =>
  mode === "seo"
    ? [
        "너는 한국 성인 라이프스타일 커머스몰의 SEO 키워드 작성자다.",
        "외부 검색 유입을 위한 키워드만 만든다.",
        "의학적 효능, 금연 효과, 건강/무해/안전 암시 표현은 쓰지 않는다.",
        "쉼표로 구분한 한 줄만 출력한다.",
        "8~14개 키워드로 제한한다.",
      ].join("\n")
    : [
        "너는 한국 커머스몰의 내부 상품 검색 태그 작성자다.",
        "사이트 내부 검색, 필터, 추천에 쓸 짧은 태그만 만든다.",
        "상품 속성, 향/무드, 호환/용도 중심으로 작성한다.",
        "의학적 효능, 금연 효과, 건강/무해/안전 암시 표현은 쓰지 않는다.",
        "쉼표로 구분한 한 줄만 출력한다.",
        "8~12개 태그로 제한한다.",
      ].join("\n");

const buildInput = ({ mode, product }: KeywordRequestBody) => `
생성 목적: ${mode === "seo" ? "외부 검색 SEO 키워드" : "내부 검색 태그"}
상품명: ${product.name}
브랜드: ${product.brandName || "-"}
간단 설명: ${product.shortDescription || "-"}
상세 설명: ${plainText(product.description) || "-"}
카테고리: ${product.categoryNames.join(", ") || "-"}
디바이스 타입: ${product.deviceType}
성분 타입: ${product.nicotineType}
배지: ${product.badges.join(", ") || "-"}
기존 태그: ${product.tags.join(", ") || "-"}
`;

const normalizeKeywordLine = (value: string) =>
  value
    .replace(/[\n\r]+/g, ", ")
    .split(",")
    .map((item) => item.trim().replace(/^[-*\d.]+\s*/, ""))
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index)
    .join(", ");

const extractResponseText = (result: unknown) => {
  if (result && typeof result === "object" && "output_text" in result) {
    const outputText = (result as { output_text?: unknown }).output_text;
    if (typeof outputText === "string") return outputText;
  }

  const output = (result as { output?: Array<{ content?: unknown }> })?.output;
  if (!Array.isArray(output)) return "";

  return output
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .map((content) => {
      if (
        content &&
        typeof content === "object" &&
        "text" in content &&
        typeof (content as { text?: unknown }).text === "string"
      ) {
        return (content as { text: string }).text;
      }
      return "";
    })
    .join("\n");
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const config = useRuntimeConfig();
  if (!config.openaiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "OPENAI_API_KEY 환경변수가 필요합니다.",
    });
  }

  const body = await readBody<KeywordRequestBody>(event);
  if (!body.product?.name || !["seo", "tag"].includes(body.mode)) {
    throw createError({
      statusCode: 400,
      statusMessage: "상품명과 생성 유형을 확인해 주세요.",
    });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.openaiModel,
      instructions: buildInstructions(body.mode),
      input: buildInput(body),
      store: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw createError({
      statusCode: response.status,
      statusMessage: `OpenAI 키워드 생성에 실패했습니다. ${errorText.slice(0, 160)}`,
    });
  }

  const result = await response.json();
  return { keywords: normalizeKeywordLine(extractResponseText(result)) };
});
