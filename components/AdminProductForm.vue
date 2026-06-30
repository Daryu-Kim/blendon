<template>
  <form class="product-form" @submit.prevent="submit">
    <AdminFormSection title="기본 정보" description="상품명, 노출 문구, 브랜드와 카테고리를 설정합니다.">
      <div class="form-grid">
        <div class="form-row"><label>상품명</label><Input v-model="form.name" required /></div>
        <div class="form-row"><label>슬러그</label><Input v-model="form.slug" placeholder="비워두면 상품명 기준 자동 생성" /></div>
        <div class="form-row"><label>가상 브랜드명</label><Input v-model="form.brandName" /></div>
        <div class="form-row wide"><label>간단 설명</label><Input v-model="form.shortDescription" /></div>
        <div class="form-row wide"><label>상세 설명</label><Textarea v-model="form.description" rows="5" /></div>
      </div>
      <div class="check-grid">
        <label v-for="category in productStore.categories" :key="category.id" class="check-item">
          <input v-model="form.categoryIds" type="checkbox" :value="category.id">
          <span>{{ category.name }}</span>
        </label>
      </div>
    </AdminFormSection>

    <AdminFormSection title="이미지" description="대표 이미지는 카드와 목록에, 상세 이미지는 상품 상세 하단에 사용합니다.">
      <div class="form-grid">
        <div class="form-row"><label>대표 이미지</label><ImageUploader v-model="form.thumbnailUrl" path-prefix="products/thumbnails" /></div>
        <div class="form-row wide"><label>목록/갤러리 이미지 URL</label><Textarea v-model="imageUrlsText" rows="3" /></div>
        <div class="form-row wide"><label>상세 이미지 URL</label><Textarea v-model="detailImageUrlsText" rows="3" /></div>
      </div>
    </AdminFormSection>

    <AdminFormSection title="가격/재고/혜택" description="회원 등급별 고정가를 비우면 회원가와 등급 할인율로 혜택가를 계산합니다.">
      <div class="form-grid">
        <div class="form-row"><label>기본가</label><Input v-model="form.basePrice" type="number" min="0" required /></div>
        <div class="form-row"><label>회원가</label><Input v-model="form.memberPrice" type="number" min="0" required /></div>
        <div class="form-row"><label>정가</label><Input v-model="compareAtPriceText" type="number" min="0" /></div>
        <div class="form-row"><label>재고</label><Input v-model="form.stock" type="number" min="0" required /></div>
        <div v-for="benefit in productStore.gradeBenefits" :key="benefit.gradeCode" class="form-row">
          <label>{{ benefit.label }} 고정가</label>
          <Input v-model="gradePriceTexts[benefit.gradeCode]" type="number" min="0" placeholder="자동 할인" />
        </div>
      </div>
    </AdminFormSection>

    <AdminFormSection title="성인/권한 정책" description="프론트 노출뿐 아니라 Firestore Rules와 서버 검증 기준으로도 사용합니다.">
      <div class="form-grid">
        <div class="form-row"><label>상태</label><Select v-model="form.status"><option value="draft">임시저장</option><option value="active">판매중</option><option value="hidden">숨김</option><option value="soldOut">품절</option><option value="deleted">삭제</option></Select></div>
        <div class="form-row"><label>노출</label><Select v-model="visibleText"><option value="true">노출</option><option value="false">숨김</option></Select></div>
        <div class="form-row"><label>성인 전용</label><Select v-model="adultOnlyText"><option value="false">아니오</option><option value="true">예</option></Select></div>
        <div class="form-row"><label>최소 열람 등급</label><Select v-model="form.minUserGradeToView"><option v-for="grade in grades" :key="grade" :value="grade">{{ grade }}</option></Select></div>
        <div class="form-row"><label>최소 구매 등급</label><Select v-model="form.minUserGradeToBuy"><option v-for="grade in grades" :key="grade" :value="grade">{{ grade }}</option></Select></div>
        <div class="form-row"><label>로그인 전 가격 숨김</label><Select v-model="hideBeforeLoginText"><option value="true">숨김</option><option value="false">표시</option></Select></div>
        <div class="form-row"><label>성인 확인 전 가격 숨김</label><Select v-model="hideBeforeAdultText"><option value="true">숨김</option><option value="false">표시</option></Select></div>
      </div>
    </AdminFormSection>

    <AdminFormSection title="속성/옵션" description="옵션은 JSON 배열로 관리하며, 추후 전용 옵션 UI로 확장할 수 있습니다.">
      <div class="form-grid">
        <div class="form-row"><label>디바이스 타입</label><Select v-model="form.deviceType"><option value="none">없음</option><option value="starter">입문용</option><option value="compact">컴팩트형</option><option value="high-power">고출력형</option><option value="all-in-one">일체형</option><option value="replaceable">교체형</option><option value="consumable">소모품</option></Select></div>
        <div class="form-row"><label>성분 타입</label><Select v-model="form.nicotineType"><option value="not-applicable">해당 없음</option><option value="nicotine-free">니코틴 프리</option><option value="alternative-nicotine">대체 니코틴</option><option value="none">없음</option></Select></div>
        <div class="form-row wide"><label>배지</label><Input v-model="badgesText" placeholder="쉼표로 구분" /></div>
        <div class="form-row wide"><label>태그</label><Input v-model="tagsText" placeholder="쉼표로 구분" /></div>
        <div class="form-row wide"><label>옵션 JSON</label><Textarea v-model="optionsText" rows="6" /></div>
        <div class="form-row wide"><label>관리자 메모</label><Textarea v-model="form.adminMemo" rows="3" /></div>
      </div>
    </AdminFormSection>

    <div class="sticky-actions">
      <Button type="button" variant="ghost" to="/admin/products">목록</Button>
      <Button type="submit">저장</Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { GradeCode, Product, ProductOption } from '~/types/domain'
import { toSafeId } from '~/utils/format'

const props = defineProps<{ product?: Product | null }>()
const emit = defineEmits<{ saved: [product: Product] }>()

const productStore = useProductStore()
const grades: GradeCode[] = ['BASIC', 'PLUS', 'PRO', 'VIP', 'BLACK']
const now = new Date().toISOString()

const defaultOption = (): ProductOption => ({
  optionId: 'default',
  optionName: '기본',
  optionCode: 'DEFAULT',
  additionalPrice: 0,
  stock: 0,
  isActive: true
})

const createEmptyProduct = (): Product => ({
  id: '',
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  categoryIds: [],
  brandName: '',
  thumbnailUrl: '',
  imageUrls: [],
  basePrice: 0,
  memberPrice: 0,
  compareAtPrice: null,
  gradePrices: {},
  stock: 0,
  options: [defaultOption()],
  badges: [],
  tags: [],
  flavorProfile: { sweetness: 0, coolness: 0, body: 0, mood: [], notes: [] },
  deviceType: 'none',
  nicotineType: 'not-applicable',
  isNicotineFree: false,
  isAlternativeNicotine: false,
  isAdultOnly: false,
  isVisible: true,
  minUserGradeToView: 'BASIC',
  minUserGradeToBuy: 'BASIC',
  isPriceHiddenBeforeLogin: true,
  isPriceHiddenBeforeAdultVerification: false,
  status: 'draft',
  detailImageUrls: [],
  viewRoles: [],
  buyRoles: [],
  seoTitle: '',
  seoDescription: '',
  adminMemo: '',
  createdAt: now,
  updatedAt: now
})

const form = reactive<Product>(props.product ? JSON.parse(JSON.stringify(props.product)) : createEmptyProduct())
const imageUrlsText = ref((form.imageUrls || []).join('\n'))
const detailImageUrlsText = ref((form.detailImageUrls || []).join('\n'))
const badgesText = ref((form.badges || []).join(', '))
const tagsText = ref((form.tags || []).join(', '))
const optionsText = ref(JSON.stringify(form.options?.length ? form.options : [defaultOption()], null, 2))
const compareAtPriceText = ref(form.compareAtPrice ? String(form.compareAtPrice) : '')
const gradePriceTexts = reactive<Record<GradeCode, string>>({
  BASIC: String(form.gradePrices?.BASIC || ''),
  PLUS: String(form.gradePrices?.PLUS || ''),
  PRO: String(form.gradePrices?.PRO || ''),
  VIP: String(form.gradePrices?.VIP || ''),
  BLACK: String(form.gradePrices?.BLACK || '')
})

const visibleText = computed({ get: () => String(form.isVisible), set: (value) => { form.isVisible = value === 'true' } })
const hideBeforeLoginText = computed({ get: () => String(form.isPriceHiddenBeforeLogin), set: (value) => { form.isPriceHiddenBeforeLogin = value === 'true' } })
const hideBeforeAdultText = computed({ get: () => String(form.isPriceHiddenBeforeAdultVerification), set: (value) => { form.isPriceHiddenBeforeAdultVerification = value === 'true' } })
const adultOnlyText = computed({
  get: () => String(form.isAdultOnly),
  set: (value) => {
    form.isAdultOnly = value === 'true'
    form.isPriceHiddenBeforeAdultVerification = value === 'true'
    if (form.isAdultOnly && form.minUserGradeToView === 'BASIC') form.minUserGradeToView = 'PLUS'
  }
})

const splitLines = (value: string) => value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean)
const splitComma = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean)

const submit = async () => {
  const id = form.id || `product-${toSafeId(form.name)}`
  const parsedOptions = JSON.parse(optionsText.value || '[]') as ProductOption[]
  const gradePrices: NonNullable<Product['gradePrices']> = {}
  grades.forEach((grade) => {
    const value = Number(gradePriceTexts[grade] || 0)
    if (value > 0) gradePrices[grade] = value
  })
  const product: Product = {
    ...form,
    id,
    slug: form.slug || toSafeId(form.name),
    basePrice: Number(form.basePrice || 0),
    memberPrice: Number(form.memberPrice || form.basePrice || 0),
    compareAtPrice: compareAtPriceText.value ? Number(compareAtPriceText.value) : null,
    gradePrices,
    stock: Number(form.stock || 0),
    imageUrls: splitLines(imageUrlsText.value || form.thumbnailUrl),
    detailImageUrls: splitLines(detailImageUrlsText.value),
    badges: splitComma(badgesText.value),
    tags: splitComma(tagsText.value),
    options: parsedOptions.length ? parsedOptions : [defaultOption()],
    isNicotineFree: form.nicotineType === 'nicotine-free',
    isAlternativeNicotine: form.nicotineType === 'alternative-nicotine',
    createdAt: form.createdAt || now,
    updatedAt: new Date().toISOString()
  }
  await productStore.upsertProduct(product)
  emit('saved', product)
}

onMounted(async () => {
  await productStore.fetchCatalog()
})
</script>

<style scoped>
.product-form {
  display: grid;
  gap: 18px;
}

.form-grid {
  display: grid;
  gap: 14px;
}

.wide {
  grid-column: 1 / -1;
}

.check-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px;
}

.check-item {
  display: flex;
  min-height: 38px;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #fff;
  padding: 0 10px;
  font-weight: 800;
}

.sticky-actions {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid var(--color-line);
  background: rgba(247, 243, 234, 0.92);
  padding: 14px 0;
  backdrop-filter: blur(14px);
}

@media (min-width: 860px) {
  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
