export type Role = 'customer' | 'staff' | 'manager' | 'admin' | 'owner'
export type GradeCode = 'BASIC' | 'PLUS' | 'PRO' | 'VIP' | 'BLACK'
export type ProductStatus = 'draft' | 'active' | 'hidden' | 'soldOut' | 'deleted'
export type NicotineType = 'none' | 'nicotine-free' | 'alternative-nicotine' | 'not-applicable'
export type DeviceType = 'starter' | 'compact' | 'high-power' | 'all-in-one' | 'replaceable' | 'consumable' | 'none'
export type PaymentStatus = 'pending' | 'ready' | 'paid' | 'failed' | 'canceled' | 'refunded'
export type PaymentMethod = 'card' | 'transfer' | 'virtual-account' | 'mobile' | 'kakaopay' | 'naverpay'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'completed' | 'canceled'
export type DeliveryStatus = 'none' | 'ready' | 'shipping' | 'delivered' | 'pickup-ready' | 'picked-up'
export type ClaimStatus = 'none' | 'requested' | 'approved' | 'rejected' | 'completed'
export type InquiryStatus = 'waiting' | 'answered' | 'closed'
export type PickupType = 'delivery' | 'store-pickup' | 'lounge-pickup'

export interface BrandConfig {
  name: string
  koName: string
  slogan: string
  description: string
  colors: {
    primary: string
    background: string
    accent: string
    secondaryAccent: string
    warning: string
    surface: string
  }
  fontFamily: string
  supportPhone: string
  supportEmail: string
  businessInfoPlaceholder: string
}

export interface Address {
  zipCode: string
  address1: string
  address2: string
}

export interface AgreementConsent {
  accepted: boolean
  agreedAt: string | null
}

export interface TermsAgreement {
  service: AgreementConsent
  privacy: AgreementConsent
  refund: AgreementConsent
  marketing: AgreementConsent
  nightMarketing: AgreementConsent
  agreedAt: string | null
}

export interface ProductOption {
  optionId: string
  optionName: string
  optionCode: string
  additionalPrice: number
  stock: number
  isActive: boolean
}

export interface FlavorProfile {
  sweetness: number
  coolness: number
  body: number
  mood: string[]
  notes: string[]
}

export interface Product {
  id: string
  name: string
  slug: string
  shortDescription: string
  description: string
  categoryIds: string[]
  brandName: string
  thumbnailUrl: string
  imageUrls: string[]
  basePrice: number
  memberPrice: number
  compareAtPrice: number | null
  gradePrices?: Partial<Record<GradeCode, number>>
  stock: number
  options: ProductOption[]
  badges: string[]
  tags: string[]
  flavorProfile: FlavorProfile
  deviceType: DeviceType
  nicotineType: NicotineType
  isNicotineFree: boolean
  isAlternativeNicotine: boolean
  isAdultOnly: boolean
  isVisible: boolean
  minUserGradeToView: GradeCode
  minUserGradeToBuy: GradeCode
  isPriceHiddenBeforeLogin: boolean
  isPriceHiddenBeforeAdultVerification: boolean
  status: ProductStatus
  detailImageUrls?: string[]
  viewRoles?: Role[]
  buyRoles?: Role[]
  seoTitle?: string
  seoDescription?: string
  adminMemo?: string
  createdAt: string
  updatedAt: string
}

export interface GradeBenefit {
  id: GradeCode
  gradeCode: GradeCode
  internalCode: string
  level: number
  label: string
  discountRate: number
  pointRate: number
  minPurchaseAmount: number
  freeShippingThreshold: number
  isVisible: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  uid: string
  loginId: string
  email: string
  displayName: string
  phoneNumber: string
  birthDate: string
  isAdultVerified: boolean
  adultVerifiedAt: string | null
  adultVerificationProvider: string | null
  userGrade: GradeCode
  role: Role
  availablePoint: number
  totalPurchaseAmount: number
  createdAt: string
  updatedAt: string
  defaultAddress: Address | null
  termsAgreement: TermsAgreement
  adminMemo?: string
}

export interface OrderItem {
  productId: string
  productName: string
  optionId: string
  optionName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  thumbnailUrl: string
  isAdultOnly: boolean
  nicotineType: NicotineType
}

export interface Order {
  id: string
  orderNo: string
  userId: string
  items: OrderItem[]
  subtotalAmount: number
  deliveryFee: number
  discountAmount: number
  pointUsed: number
  totalAmount: number
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  orderStatus: OrderStatus
  deliveryStatus: DeliveryStatus
  claimStatus: ClaimStatus
  paymentProvider: 'portone'
  portonePaymentId: string | null
  portoneImpUid?: string | null
  paymentId?: string | null
  recipientName: string
  recipientPhone: string
  address: Address
  deliveryMemo: string
  pickupType: PickupType
  createdAt: string
  updatedAt: string
  paidAt: string | null
  adminMemo?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  depth: number
  order: number
  isVisible: boolean
  minUserGradeToView: GradeCode
  adultOnly: boolean
}

export interface CartItem {
  id: string
  userId: string
  productId: string
  optionId: string
  quantity: number
  createdAt: string
  updatedAt: string
}

export interface Banner {
  id: string
  title: string
  subtitle: string
  imageUrl: string
  buttonText: string
  linkUrl: string
  isActive: boolean
  order: number
  placement: 'home-main' | 'home-section' | 'notice'
}

export interface Notice {
  id: string
  title: string
  content: string
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

export interface Inquiry {
  id: string
  userId: string
  title: string
  content: string
  status: InquiryStatus
  answer: string | null
  createdAt: string
  answeredAt: string | null
}

export interface AdultVerificationLog {
  id: string
  userId: string
  provider: 'mock' | 'portone' | 'external'
  status: 'requested' | 'verified' | 'failed'
  birthDate: string
  requestedAt: string
  verifiedAt: string | null
  reason?: string
}
