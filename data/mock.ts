import { categorySeed } from '~/config/catalog'
import type { Banner, Inquiry, Notice, Order, Product, UserProfile } from '~/types/domain'

const now = new Date('2026-06-29T00:00:00.000+09:00').toISOString()

const productImage = (label: string, bg = 'FDFBF6', accent = 'D6A85A') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720">
    <rect width="720" height="720" fill="#${bg}"/>
    <rect x="112" y="112" width="496" height="496" rx="48" fill="#ffffff" stroke="#E8DFD0" stroke-width="8"/>
    <circle cx="510" cy="194" r="58" fill="#${accent}" opacity="0.85"/>
    <rect x="190" y="230" width="110" height="260" rx="32" fill="#171717"/>
    <rect x="330" y="270" width="200" height="64" rx="32" fill="#8FAE9D"/>
    <rect x="330" y="358" width="150" height="36" rx="18" fill="#D6A85A"/>
    <text x="360" y="568" text-anchor="middle" font-family="Pretendard, Arial, sans-serif" font-size="34" font-weight="800" fill="#171717">${label}</text>
  </svg>
`)}`

export const mockProducts: Product[] = [
  {
    id: 'product-blend-device-one',
    name: 'Blend Device One',
    slug: 'blend-device-one',
    shortDescription: '처음 고르기 쉬운 컴팩트 디바이스',
    description: '간결한 조작감과 안정적인 휴대성을 기준으로 구성한 입문형 디바이스입니다. 호환 리필과 함께 선택할 수 있습니다.',
    categoryIds: ['device', 'device-starter', 'starter-pick'],
    brandName: 'Blend Studio',
    thumbnailUrl: productImage('Device One'),
    imageUrls: [productImage('Device One'), productImage('Starter Kit', 'F7F3EA', '8FAE9D')],
    basePrice: 52000,
    memberPrice: 49000,
    compareAtPrice: 59000,
    stock: 18,
    options: [
      { optionId: 'black', optionName: 'Charcoal Black', optionCode: 'BDO-BK', additionalPrice: 0, stock: 10, isActive: true },
      { optionId: 'cream', optionName: 'Soft Cream', optionCode: 'BDO-CR', additionalPrice: 2000, stock: 8, isActive: true }
    ],
    badges: ['입문 추천', '회원가'],
    tags: ['컴팩트', '데일리', '처음이라면'],
    flavorProfile: { sweetness: 0, coolness: 0, body: 3, mood: ['clean', 'daily'], notes: ['device'] },
    deviceType: 'starter',
    nicotineType: 'not-applicable',
    isNicotineFree: false,
    isAlternativeNicotine: false,
    isAdultOnly: false,
    isVisible: true,
    minUserGradeToView: 'BASIC',
    minUserGradeToBuy: 'BASIC',
    isPriceHiddenBeforeLogin: true,
    isPriceHiddenBeforeAdultVerification: false,
    status: 'active',
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'product-daily-flavor-peach',
    name: 'Daily Flavor Peach',
    slug: 'daily-flavor-peach',
    shortDescription: '복숭아 노트가 은은한 데일리 플레이버',
    description: '과일 향과 산뜻한 마무리를 중심으로 만든 니코틴 프리 플레이버입니다. 성분 안내와 사용 방법을 확인한 뒤 선택해 주세요.',
    categoryIds: ['flavor', 'flavor-fruit', 'nicotine-free', 'nicotine-free-daily'],
    brandName: 'Blend Lab',
    thumbnailUrl: productImage('Peach Zero', 'FFF8EE', 'E86F61'),
    imageUrls: [productImage('Peach Zero', 'FFF8EE', 'E86F61')],
    basePrice: 26000,
    memberPrice: 24000,
    compareAtPrice: 30000,
    stock: 42,
    options: [
      { optionId: '30ml', optionName: '30ml', optionCode: 'DFP-30', additionalPrice: 0, stock: 22, isActive: true },
      { optionId: '60ml', optionName: '60ml', optionCode: 'DFP-60', additionalPrice: 17000, stock: 20, isActive: true }
    ],
    badges: ['니코틴 프리', '인기'],
    tags: ['과일', '부드러운 향', '데일리'],
    flavorProfile: { sweetness: 4, coolness: 1, body: 2, mood: ['bright', 'soft'], notes: ['peach', 'white tea'] },
    deviceType: 'none',
    nicotineType: 'nicotine-free',
    isNicotineFree: true,
    isAlternativeNicotine: false,
    isAdultOnly: false,
    isVisible: true,
    minUserGradeToView: 'BASIC',
    minUserGradeToBuy: 'BASIC',
    isPriceHiddenBeforeLogin: false,
    isPriceHiddenBeforeAdultVerification: false,
    status: 'active',
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'product-fresh-mint-zero',
    name: 'Fresh Mint Zero',
    slug: 'fresh-mint-zero',
    shortDescription: '시원한 마무리의 무니코틴 플레이버',
    description: '멘솔 노트를 중심으로 산뜻하게 정리한 니코틴 프리 제품입니다. 개인 취향과 디바이스 호환성을 먼저 확인해 주세요.',
    categoryIds: ['flavor', 'flavor-menthol', 'nicotine-free', 'nicotine-free-flavor'],
    brandName: 'Blend Lab',
    thumbnailUrl: productImage('Mint Zero', 'F3FBF6', '8FAE9D'),
    imageUrls: [productImage('Mint Zero', 'F3FBF6', '8FAE9D')],
    basePrice: 24000,
    memberPrice: 23000,
    compareAtPrice: null,
    stock: 35,
    options: [{ optionId: 'standard', optionName: 'Standard', optionCode: 'FMZ-ST', additionalPrice: 0, stock: 35, isActive: true }],
    badges: ['니코틴 프리'],
    tags: ['멘솔', '깔끔한 향', '리프레시'],
    flavorProfile: { sweetness: 1, coolness: 5, body: 2, mood: ['fresh', 'simple'], notes: ['mint', 'ice'] },
    deviceType: 'none',
    nicotineType: 'nicotine-free',
    isNicotineFree: true,
    isAlternativeNicotine: false,
    isAdultOnly: false,
    isVisible: true,
    minUserGradeToView: 'BASIC',
    minUserGradeToBuy: 'BASIC',
    isPriceHiddenBeforeLogin: false,
    isPriceHiddenBeforeAdultVerification: false,
    status: 'active',
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'product-lounge-pick-cartridge',
    name: 'Lounge Pick Cartridge',
    slug: 'lounge-pick-cartridge',
    shortDescription: '라운지 셀렉션 호환 카트리지',
    description: '휴대와 교체가 쉬운 카트리지입니다. 호환 모델과 권장 교체 주기를 확인해 주세요.',
    categoryIds: ['consumable', 'consumable-cartridge', 'lounge-pick'],
    brandName: 'Blend Studio',
    thumbnailUrl: productImage('Cartridge', 'F8F5ED', 'D6A85A'),
    imageUrls: [productImage('Cartridge', 'F8F5ED', 'D6A85A')],
    basePrice: 18000,
    memberPrice: 17000,
    compareAtPrice: null,
    stock: 8,
    options: [
      { optionId: 'pack2', optionName: '2개입', optionCode: 'LPC-2', additionalPrice: 0, stock: 8, isActive: true },
      { optionId: 'pack4', optionName: '4개입', optionCode: 'LPC-4', additionalPrice: 16000, stock: 4, isActive: true }
    ],
    badges: ['라운지 픽', '품절 임박'],
    tags: ['카트리지', '소모품', '교체형'],
    flavorProfile: { sweetness: 0, coolness: 0, body: 1, mood: ['utility'], notes: ['cartridge'] },
    deviceType: 'consumable',
    nicotineType: 'not-applicable',
    isNicotineFree: false,
    isAlternativeNicotine: false,
    isAdultOnly: false,
    isVisible: true,
    minUserGradeToView: 'BASIC',
    minUserGradeToBuy: 'BASIC',
    isPriceHiddenBeforeLogin: false,
    isPriceHiddenBeforeAdultVerification: false,
    status: 'active',
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'product-compact-starter-kit',
    name: 'Compact Starter Kit',
    slug: 'compact-starter-kit',
    shortDescription: '디바이스와 기본 소모품을 묶은 스타터 구성',
    description: '입문에 필요한 기본 구성을 한 번에 확인할 수 있는 키트입니다. 구성품과 호환 범위를 확인한 뒤 선택해 주세요.',
    categoryIds: ['device', 'device-compact', 'starter-pick'],
    brandName: 'Blend Studio',
    thumbnailUrl: productImage('Starter Kit', 'FDFBF6', '8FAE9D'),
    imageUrls: [productImage('Starter Kit', 'FDFBF6', '8FAE9D')],
    basePrice: 79000,
    memberPrice: 74000,
    compareAtPrice: 89000,
    stock: 14,
    options: [{ optionId: 'kit', optionName: '기본 키트', optionCode: 'CSK-BASIC', additionalPrice: 0, stock: 14, isActive: true }],
    badges: ['처음이라면', '세트'],
    tags: ['입문', '키트', '컴팩트'],
    flavorProfile: { sweetness: 0, coolness: 0, body: 3, mood: ['starter'], notes: ['kit'] },
    deviceType: 'compact',
    nicotineType: 'not-applicable',
    isNicotineFree: false,
    isAlternativeNicotine: false,
    isAdultOnly: false,
    isVisible: true,
    minUserGradeToView: 'BASIC',
    minUserGradeToBuy: 'BASIC',
    isPriceHiddenBeforeLogin: true,
    isPriceHiddenBeforeAdultVerification: false,
    status: 'active',
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'product-alt-choice-soft',
    name: 'Alt Choice Soft',
    slug: 'alt-choice-soft',
    shortDescription: '성인 인증 회원을 위한 대체 선택지',
    description: '성인 인증 완료 회원만 상세 안내를 확인할 수 있는 상품입니다. 성분과 사용 안내를 충분히 확인한 뒤 선택해 주세요.',
    categoryIds: ['adult-only', 'alternative-nicotine'],
    brandName: 'Blend Adult Select',
    thumbnailUrl: productImage('Adult Select', 'F8F1EA', '171717'),
    imageUrls: [productImage('Adult Select', 'F8F1EA', '171717')],
    basePrice: 36000,
    memberPrice: 34000,
    compareAtPrice: null,
    stock: 20,
    options: [{ optionId: 'soft', optionName: 'Soft', optionCode: 'ACS-S', additionalPrice: 0, stock: 20, isActive: true }],
    badges: ['성인 인증', '회원 전용'],
    tags: ['성인 전용', '성분 확인 필요'],
    flavorProfile: { sweetness: 2, coolness: 2, body: 4, mood: ['adult-only'], notes: ['restricted'] },
    deviceType: 'none',
    nicotineType: 'alternative-nicotine',
    isNicotineFree: false,
    isAlternativeNicotine: true,
    isAdultOnly: true,
    isVisible: true,
    minUserGradeToView: 'PLUS',
    minUserGradeToBuy: 'PLUS',
    isPriceHiddenBeforeLogin: true,
    isPriceHiddenBeforeAdultVerification: true,
    status: 'active',
    createdAt: now,
    updatedAt: now
  }
]

export const mockUsers: UserProfile[] = [
  {
    uid: 'mock-user',
    loginId: 'customer',
    email: 'customer@example.com',
    displayName: '블렌드 고객',
    phoneNumber: '010-0000-0000',
    birthDate: '1990-01-01',
    isAdultVerified: true,
    adultVerifiedAt: now,
    adultVerificationProvider: 'mock',
    userGrade: 'PLUS',
    role: 'customer',
    availablePoint: 5000,
    totalPurchaseAmount: 280000,
    createdAt: now,
    updatedAt: now,
    defaultAddress: { zipCode: '00000', address1: '서울시 샘플구 블렌드로 1', address2: '101호' },
    termsAgreement: {
      service: { accepted: true, agreedAt: now },
      privacy: { accepted: true, agreedAt: now },
      refund: { accepted: true, agreedAt: now },
      marketing: { accepted: true, agreedAt: now },
      nightMarketing: { accepted: false, agreedAt: null },
      agreedAt: now
    }
  },
  {
    uid: 'mock-admin',
    loginId: 'admin',
    email: 'admin@example.com',
    displayName: '관리자',
    phoneNumber: '010-1111-1111',
    birthDate: '1988-01-01',
    isAdultVerified: true,
    adultVerifiedAt: now,
    adultVerificationProvider: 'mock',
    userGrade: 'BLACK',
    role: 'admin',
    availablePoint: 0,
    totalPurchaseAmount: 0,
    createdAt: now,
    updatedAt: now,
    defaultAddress: null,
    termsAgreement: {
      service: { accepted: true, agreedAt: now },
      privacy: { accepted: true, agreedAt: now },
      refund: { accepted: true, agreedAt: now },
      marketing: { accepted: false, agreedAt: null },
      nightMarketing: { accepted: false, agreedAt: null },
      agreedAt: now
    }
  }
]

export const mockOrders: Order[] = [
  {
    id: 'order-20260629-0001',
    orderNo: 'BO202606290001',
    userId: 'mock-user',
    items: [
      {
        productId: 'product-daily-flavor-peach',
        productName: 'Daily Flavor Peach',
        optionId: '30ml',
        optionName: '30ml',
        quantity: 1,
        unitPrice: 24000,
        totalPrice: 24000,
        thumbnailUrl: mockProducts[1]?.thumbnailUrl || '',
        isAdultOnly: false,
        nicotineType: 'nicotine-free'
      }
    ],
    subtotalAmount: 24000,
    deliveryFee: 3000,
    discountAmount: 0,
    pointUsed: 0,
    totalAmount: 27000,
    paymentStatus: 'paid',
    paymentMethod: 'card',
    orderStatus: 'confirmed',
    deliveryStatus: 'ready',
    claimStatus: 'none',
    paymentProvider: 'portone',
    portonePaymentId: 'mock-payment-1',
    portoneImpUid: null,
    paymentId: 'mock-payment-1',
    recipientName: '블렌드 고객',
    recipientPhone: '010-0000-0000',
    address: { zipCode: '00000', address1: '서울시 샘플구 블렌드로 1', address2: '101호' },
    deliveryMemo: '문 앞에 놓아주세요.',
    pickupType: 'delivery',
    createdAt: now,
    updatedAt: now,
    paidAt: now
  }
]

export const mockBanners: Banner[] = [
  {
    id: 'home-main',
    title: '취향을 블렌딩하다, BLEND ON',
    subtitle: '향, 맛, 무드를 쉽고 깔끔하게 고르는 성인 라이프스타일 편집샵.',
    imageUrl: '',
    buttonText: '인기 상품 보기',
    linkUrl: '/products',
    isActive: true,
    order: 1,
    placement: 'home-main'
  }
]

export const mockNotices: Notice[] = [
  {
    id: 'notice-adult',
    title: '성인 인증 및 상품 노출 정책 안내',
    content: '성인 전용 상품은 로그인과 성인 인증 완료 후에만 상세 정보와 가격을 확인할 수 있습니다.',
    isPinned: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'notice-pickup',
    title: '매장 픽업 기능 준비 안내',
    content: '온라인 주문 후 매장 픽업 기능은 오프라인 매장 오픈 일정에 맞춰 순차적으로 제공될 예정입니다.',
    isPinned: false,
    createdAt: now,
    updatedAt: now
  }
]

export const mockInquiries: Inquiry[] = [
  {
    id: 'inquiry-1',
    userId: 'mock-user',
    title: '호환 카트리지 문의',
    content: 'Compact Starter Kit와 호환되는 카트리지를 알고 싶어요.',
    status: 'waiting',
    answer: null,
    createdAt: now,
    answeredAt: null
  }
]

export const mockCategories = categorySeed
