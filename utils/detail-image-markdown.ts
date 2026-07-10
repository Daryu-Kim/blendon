import type { ProductOption } from "~/types/domain";

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

export interface DetailOptionBuyerRule {
  key: DetailImageBuyerKey;
  selectors: string[];
  textAttribute?: string;
  codeAttribute?: string;
}

export const CRAWLED_OPTION_DEFAULT_STOCK = 100;

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

const cafe24OptionSelectors = [
  "table.xans-element-.xans-product.xans-product-option.xans-record- optgroup > option",
  "table.xans-element-.xans-product.xans-product-option.xans-record- option",
];

export const detailOptionBuyerRules: DetailOptionBuyerRule[] = [
  { key: "medusa", selectors: cafe24OptionSelectors },
  { key: "vapetopia", selectors: cafe24OptionSelectors },
  {
    key: "purecloud",
    selectors: ["#it_option_1 option", "#it_option_1 > option"],
  },
  { key: "vapecompany", selectors: cafe24OptionSelectors },
  {
    key: "0vape",
    selectors: [
      "#shopProductContentInfo > div.shopProductOptionListDiv.row.selectOptions.designSettingElement.text-body > div.productOption.custom-select-wrapper > div > div > div.custom-select-box-list-inner > div > div",
    ],
  },
  { key: "emvape", selectors: cafe24OptionSelectors },
  {
    key: "siasiu",
    selectors: ["div.select optgroup option", "div.select option"],
  },
  {
    key: "vanom",
    selectors: ["#prod_options > div > div > div.txt_l > label"],
    textAttribute: "data-title",
    codeAttribute: "data-optcode",
  },
  { key: "cigarman", selectors: cafe24OptionSelectors },
  {
    key: "bluemong",
    selectors: ["#product_option_id1 > optgroup > option", "#product_option_id1 > option"],
  },
  {
    key: "airvaper",
    selectors: ["#product_option_id1 > optgroup > option", "#product_option_id1 > option"],
  },
  {
    key: "beba",
    selectors: [
      "#frmView > div > div > div.item_detail_list > div > dl > dd > select > optgroup > option",
      "#frmView > div > div > div.item_detail_list > div > dl > dd > select > option",
    ],
  },
  {
    key: "boomboom",
    selectors: ["#product_option_id1 > optgroup > option", "#product_option_id1 > option"],
  },
  {
    key: "dragonvapes",
    selectors: ["#product_option_id1 > optgroup > option", "#product_option_id1 > option"],
  },
  {
    key: "paxvape",
    selectors: ["#product_option_id1 option", "#product_option_id1 > optgroup > option"],
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

const safeQueryElements = (doc: Document, selector: string) => {
  try {
    return Array.from(doc.querySelectorAll<HTMLElement>(selector));
  } catch {
    return [];
  }
};

const findOptionElements = (doc: Document, rule: DetailOptionBuyerRule) => {
  for (const selector of rule.selectors) {
    const elements = safeQueryElements(doc, selector);
    if (elements.length) return elements;
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

const soldOutPattern = /\[\s*품절\s*\]|\(\s*품절\s*\)|품절|sold\s*out/gi;

const normalizeOptionText = (text: string | null | undefined) => {
  let normalized = String(text || "").replace(soldOutPattern, "").trim();
  if (!normalized) return "";

  const priceTokens: string[] = [];
  normalized = normalized.replace(
    /\([+-]?\s*\d[\d,]*(?:\s*원)?\)/g,
    (match) => {
      priceTokens.push(match);
      return `__PRICE_${priceTokens.length - 1}__`;
    },
  );
  normalized = normalized.replace(/\([^()]*\)/g, "");
  priceTokens.forEach((price, index) => {
    normalized = normalized.replace(`__PRICE_${index}__`, price);
  });

  return normalized.replace(/\s+/g, " ").trim();
};

const optionRawText = (element: HTMLElement, rule: DetailOptionBuyerRule) =>
  (rule.textAttribute
    ? element.getAttribute(rule.textAttribute)
    : element.textContent) || "";

const optionRawCode = (element: HTMLElement, rule: DetailOptionBuyerRule) => {
  if (rule.codeAttribute) return element.getAttribute(rule.codeAttribute) || "";
  if (element instanceof HTMLOptionElement) return element.value || "";
  return element.getAttribute("data-value") || element.getAttribute("value") || "";
};

const isPlaceholderOption = (
  element: HTMLElement,
  rule: DetailOptionBuyerRule,
) => {
  const rawText = optionRawText(element, rule);
  const normalizedText = normalizeOptionText(rawText);
  const rawCode = optionRawCode(element, rule).trim();

  if (element instanceof HTMLOptionElement || rule.codeAttribute) {
    if (!rawCode || rawCode === "*" || rawCode === "**") return true;
  }

  if (!normalizedText) return true;
  if (rawText.replace(soldOutPattern, "").includes("[")) return true;
  if (normalizedText.includes("제조")) return true;
  if (/^(선택|옵션 선택|선택하세요|선택해주세요)$/i.test(normalizedText)) {
    return true;
  }
  if (/^-?\s*(필수\s*)?옵션\s*선택/i.test(normalizedText)) return true;

  return false;
};

export const extractProductOptions = (
  html: string,
  buyerKey: DetailImageBuyerKey,
): ProductOption[] => {
  if (!html.trim() || typeof DOMParser === "undefined") return [];

  const rule = detailOptionBuyerRules.find((item) => item.key === buyerKey);
  if (!rule) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const optionNames = findOptionElements(doc, rule)
    .filter((element) => !isPlaceholderOption(element, rule))
    .map((element) => normalizeOptionText(optionRawText(element, rule)))
    .filter(Boolean);
  const uniqueOptionNames = Array.from(new Set(optionNames));

  return uniqueOptionNames.map((optionName, index) => {
    const optionCode = (index + 1).toString().padStart(4, "0");
    return {
      optionId: `option-${optionCode}`,
      optionName,
      optionCode,
      additionalPrice: 0,
      stock: CRAWLED_OPTION_DEFAULT_STOCK,
      isActive: true,
    };
  });
};

export const productOptionsToText = (options: ProductOption[]) =>
  options
    .map((option) => `${option.optionCode}\t${option.optionName}\t재고 ${option.stock}`)
    .join("\n");

export const detailImageUrlsToMarkdown = (urls: string[]) =>
  urls.map((url) => `![](${url})`).join("\n\n");

export const extractDetailImageMarkdown = (
  html: string,
  buyerKey: DetailImageBuyerKey,
) => detailImageUrlsToMarkdown(extractDetailImageUrls(html, buyerKey));
