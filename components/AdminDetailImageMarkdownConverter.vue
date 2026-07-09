<template>
  <div class="detail-image-converter">
    <div class="converter-head">
      <div>
        <strong>도매사 상세 이미지 변환</strong>
        <p>
          기존 상품 상세 HTML을 붙여넣고 도매사를 선택하면 이미지 링크를
          마크다운 이미지 문법으로 복사합니다.
        </p>
      </div>
      <span v-if="imageCount">{{ imageCount }}개 이미지</span>
    </div>

    <Textarea
      v-model="sourceHtml"
      rows="7"
      placeholder="기존 쇼핑몰 상품 상세 HTML을 붙여넣어 주세요."
    />

    <div class="buyer-actions">
      <Button
        v-for="buyer in detailImageBuyerRules"
        :key="buyer.key"
        type="button"
        size="sm"
        variant="ghost"
        @click="convertAndCopy(buyer.key)"
      >
        {{ buyer.label }}
      </Button>
    </div>

    <div v-if="convertedMarkdown" class="converter-result">
      <Textarea v-model="convertedMarkdown" rows="5" readonly />
      <div class="result-actions">
        <p>복사된 내용을 상세 설명 마크다운에 붙여넣으면 됩니다.</p>
        <Button type="button" size="sm" variant="secondary" @click="copyResult">
          다시 복사
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  detailImageBuyerRules,
  detailImageUrlsToMarkdown,
  extractDetailImageUrls,
  type DetailImageBuyerKey,
} from "~/utils/detail-image-markdown";

const toast = useToast();
const sourceHtml = ref("");
const convertedMarkdown = ref("");
const imageCount = ref(0);

const copyToClipboard = async (value: string) => {
  if (!import.meta.client) return false;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // 일부 브라우저/HTTP 환경에서는 Clipboard API가 거절되어 아래 fallback을 사용합니다.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
};

const copyResult = async () => {
  if (!convertedMarkdown.value) return;

  try {
    await copyToClipboard(convertedMarkdown.value);
    toast.show("마크다운 이미지 링크를 다시 복사했습니다.", "success");
  } catch {
    toast.show("클립보드 복사에 실패했어요.", "error");
  }
};

const convertAndCopy = async (buyerKey: DetailImageBuyerKey) => {
  const urls = extractDetailImageUrls(sourceHtml.value, buyerKey);
  const buyerLabel =
    detailImageBuyerRules.find((buyer) => buyer.key === buyerKey)?.label ||
    buyerKey;

  if (!sourceHtml.value.trim()) {
    toast.show("먼저 상품 상세 HTML을 붙여넣어 주세요.", "warning");
    return;
  }

  if (!urls.length) {
    convertedMarkdown.value = "";
    imageCount.value = 0;
    toast.show(`${buyerLabel} 상세 이미지 링크를 찾지 못했어요.`, "warning");
    return;
  }

  convertedMarkdown.value = detailImageUrlsToMarkdown(urls);
  imageCount.value = urls.length;

  try {
    await copyToClipboard(convertedMarkdown.value);
    toast.show(`${buyerLabel} 상세 이미지 ${urls.length}개를 복사했습니다.`, "success");
  } catch {
    toast.show("변환은 완료했지만 클립보드 복사에 실패했어요.", "error");
  }
};
</script>

<style scoped>
.detail-image-converter {
  display: grid;
  gap: 12px;
  border-top: 1px solid var(--color-line);
  padding-top: 14px;
}

.converter-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.converter-head strong {
  display: block;
  font-size: 14px;
  line-height: 1.35;
}

.converter-head p,
.result-actions p {
  margin: 4px 0 0;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.45;
}

.converter-head span {
  flex: 0 0 auto;
  border-radius: 999px;
  background: #f7f3ea;
  padding: 6px 10px;
  color: #8d6b28;
  font-size: 12px;
  font-weight: 900;
}

.buyer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.converter-result {
  display: grid;
  gap: 8px;
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
</style>
