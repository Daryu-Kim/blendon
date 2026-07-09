export type DetailImageBuyerKey =
  | "medusa"
  | "vapetopia"
  | "purecloud"
  | "vapecompany"
  | "0vape"
  | "emvape"
  | "siasiu"
  | "vanom"
  | "cigarman"
  | "bluemong"
  | "airvaper"
  | "beba"
  | "boomboom"
  | "dragonvapes"
  | "kvape"
  | "paxvape"
  | "manual";

export interface DetailImageBuyerRule {
  key: DetailImageBuyerKey;
  label: string;
  baseUrl: string;
  selectors: string[];
  preferredAttributes?: string[];
}

export const detailImageBuyerRules: DetailImageBuyerRule[] = [
  {
    key: "medusa",
    label: "메두사",
    baseUrl: "https://medusamall.com",
    selectors: ["#prdDetail > div.cont img"],
  },
  {
    key: "vapetopia",
    label: "베이프토피아",
    baseUrl: "",
    selectors: ["#prdDetail img"],
  },
  {
    key: "purecloud",
    label: "퓨어클라우드",
    baseUrl: "",
    selectors: ["#sit_inf_explan img"],
  },
  {
    key: "vapecompany",
    label: "베이프컴퍼니",
    baseUrl: "https://vapecompany.co.kr",
    selectors: ["#prdDetail > div:nth-child(1) > div img", "#prdDetail > div img"],
    preferredAttributes: ["ec-data-src"],
  },
  {
    key: "0vape",
    label: "0vape",
    baseUrl: "",
    selectors: ["div.productDetailSection img"],
    preferredAttributes: ["data-src"],
  },
  {
    key: "emvape",
    label: "이엠베이프",
    baseUrl: "",
    selectors: ["#prdDetail img"],
  },
  {
    key: "siasiu",
    label: "시아시우",
    baseUrl: "",
    selectors: ["#PRODUCT_DETAIL img"],
  },
  {
    key: "vanom",
    label: "바놈",
    baseUrl: "",
    selectors: ["#prod_detail_body > p > img"],
  },
  {
    key: "cigarman",
    label: "시가맨",
    baseUrl: "https://cigarman.co.kr/",
    selectors: ["#prdDetail > div.cont img"],
  },
  {
    key: "bluemong",
    label: "블루몽",
    baseUrl: "https://blumongvape.com",
    selectors: ["#prdDetail img"],
  },
  {
    key: "airvaper",
    label: "에어베이퍼",
    baseUrl: "https://airvaper.com",
    selectors: ["#prdDetail > div.cont img"],
  },
  {
    key: "beba",
    label: "베바",
    baseUrl: "",
    selectors: ["#detail > div.detail_cont > div img"],
  },
  {
    key: "boomboom",
    label: "붐붐",
    baseUrl: "https://boomboomliquid.com",
    selectors: ["#prdDetail > div > div img"],
  },
  {
    key: "dragonvapes",
    label: "드래곤베이프",
    baseUrl: "https://dragonvapes.kr",
    selectors: [
      "#contents2 > div.xans-element-.xans-product.xans-product-detail > div.xans-element-.xans-product.xans-product-additional > div.cont > div.edibot-product-detail > div > img",
    ],
  },
  {
    key: "kvape",
    label: "K-VAPE",
    baseUrl: "https://www.k-vape.co.kr/",
    selectors: ["#glores-B-view-tab-cont1 > div.glores-B-goods-content > p > img"],
  },
  {
    key: "paxvape",
    label: "팍스베이프",
    baseUrl: "",
    selectors: ["#prdDetail img"],
  },
  {
    key: "manual",
    label: "전체 이미지",
    baseUrl: "",
    selectors: ["img"],
  },
];

const fallbackAttributes = [
  "src",
  "data-src",
  "ec-data-src",
  "data-original",
  "data-lazy",
  "data-lazy-src",
  "lazy-src",
];

const safeQueryImages = (doc: Document, selector: string) => {
  try {
    return Array.from(doc.querySelectorAll<HTMLImageElement>(selector));
  } catch {
    return [];
  }
};

const findDetailImages = (doc: Document, rule: DetailImageBuyerRule) => {
  for (const selector of rule.selectors) {
    const images = safeQueryImages(doc, selector);
    if (images.length) return images;
  }

  return [];
};

const firstAttributeValue = (
  image: HTMLImageElement,
  attributes: string[],
) => {
  for (const attribute of attributes) {
    const value = image.getAttribute(attribute)?.trim();
    if (value) return value;
  }

  return image.currentSrc || image.src || "";
};

const trimSlashes = (value: string, direction: "left" | "right") =>
  direction === "left" ? value.replace(/^\/+/, "") : value.replace(/\/+$/, "");

const withBaseUrl = (url: string, baseUrl: string) => {
  if (!baseUrl || /^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;

  return `${trimSlashes(baseUrl, "right")}/${trimSlashes(url, "left")}`;
};

const normalizeImageUrl = (
  image: HTMLImageElement,
  rule: DetailImageBuyerRule,
  currentOrigin: string,
) => {
  const attributes = [
    ...(rule.preferredAttributes || []),
    ...fallbackAttributes,
  ];
  const rawUrl = firstAttributeValue(image, attributes)
    .replace(/&amp;/g, "&")
    .trim();
  if (!rawUrl || rawUrl.startsWith("data:") || rawUrl.startsWith("blob:"))
    return "";

  const url = rawUrl.startsWith(currentOrigin)
    ? rawUrl.replace(currentOrigin, rule.baseUrl)
    : rawUrl;

  if (url.startsWith("//")) return `https:${url}`;
  return withBaseUrl(url, rule.baseUrl);
};

export const extractDetailImageUrls = (
  html: string,
  buyerKey: DetailImageBuyerKey,
  currentOrigin = import.meta.client ? window.location.origin : "",
) => {
  if (!html.trim() || typeof DOMParser === "undefined") return [];

  const rule = detailImageBuyerRules.find((item) => item.key === buyerKey);
  if (!rule) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const images = findDetailImages(doc, rule);
  const urls = images
    .map((image) => normalizeImageUrl(image, rule, currentOrigin))
    .filter(Boolean);

  return Array.from(new Set(urls));
};

export const detailImageUrlsToMarkdown = (urls: string[]) =>
  urls.map((url) => `![](${url})`).join("\n\n");

export const extractDetailImageMarkdown = (
  html: string,
  buyerKey: DetailImageBuyerKey,
) => detailImageUrlsToMarkdown(extractDetailImageUrls(html, buyerKey));
