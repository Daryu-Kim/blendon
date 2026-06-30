import { canBuyProduct, currentUnitPrice } from '~/utils/access'
import { createOrderNo } from '~/utils/format'
import type { Address, CartItem, Order, OrderItem, PaymentMethod, PickupType, Product, UserProfile } from '~/types/domain'

export interface ServerCheckoutInput {
  recipientName: string
  recipientPhone: string
  address: Address
  deliveryMemo: string
  pickupType: PickupType
  pointUsed: number
  paymentMethod: PaymentMethod
}

export const buildPendingOrder = (user: UserProfile, cartItems: CartItem[], checkout: ServerCheckoutInput, products: Product[]): Order => {
  if (!user) throw createError({ statusCode: 401, statusMessage: '로그인이 필요합니다.' })
  if (!cartItems.length) throw createError({ statusCode: 400, statusMessage: '장바구니가 비어 있습니다.' })
  if (checkout.pickupType === 'delivery' && (!checkout.address.zipCode || !checkout.address.address1 || !checkout.address.address2)) {
    throw createError({ statusCode: 400, statusMessage: '배송 주소를 입력해 주세요.' })
  }

  const items: OrderItem[] = cartItems.map((cartItem) => {
    const product = products.find((item) => item.id === cartItem.productId)
    if (!product) throw createError({ statusCode: 404, statusMessage: '상품을 찾을 수 없습니다.' })
    if (!canBuyProduct(product, user)) throw createError({ statusCode: 403, statusMessage: '상품 구매 권한을 확인해 주세요.' })

    const option = product.options.find((item) => item.optionId === cartItem.optionId)
    if (!option || !option.isActive) throw createError({ statusCode: 400, statusMessage: '상품 옵션을 확인해 주세요.' })
    if (product.stock < cartItem.quantity || option.stock < cartItem.quantity) {
      throw createError({ statusCode: 409, statusMessage: '재고가 부족합니다.' })
    }

    const unitPrice = currentUnitPrice(product, user) + option.additionalPrice
    return {
      productId: product.id,
      productName: product.name,
      optionId: option.optionId,
      optionName: option.optionName,
      quantity: cartItem.quantity,
      unitPrice,
      totalPrice: unitPrice * cartItem.quantity,
      thumbnailUrl: product.thumbnailUrl,
      isAdultOnly: product.isAdultOnly,
      nicotineType: product.nicotineType
    }
  })

  const subtotalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const deliveryFee = checkout.pickupType === 'delivery' && subtotalAmount < 50000 ? 3000 : 0
  const discountAmount = 0
  const pointLimit = Math.floor((subtotalAmount + deliveryFee - discountAmount) * 0.1)
  const pointUsed = Math.min(Math.max(checkout.pointUsed || 0, 0), user.availablePoint, pointLimit)
  const totalAmount = subtotalAmount + deliveryFee - discountAmount - pointUsed
  const now = new Date().toISOString()
  const orderNo = createOrderNo()
  const paymentId = `payment-${orderNo}`

  return {
    id: `order-${orderNo}`,
    orderNo,
    userId: user.uid,
    items,
    subtotalAmount,
    deliveryFee,
    discountAmount,
    pointUsed,
    totalAmount,
    paymentStatus: 'pending',
    paymentMethod: checkout.paymentMethod,
    orderStatus: 'pending',
    deliveryStatus: checkout.pickupType === 'delivery' ? 'none' : 'pickup-ready',
    claimStatus: 'none',
    paymentProvider: 'portone',
    portonePaymentId: paymentId,
    portoneImpUid: null,
    paymentId,
    recipientName: checkout.recipientName,
    recipientPhone: checkout.recipientPhone,
    address: checkout.pickupType === 'delivery' ? checkout.address : { zipCode: '', address1: '', address2: '' },
    deliveryMemo: checkout.pickupType === 'delivery' ? checkout.deliveryMemo : '',
    pickupType: checkout.pickupType,
    createdAt: now,
    updatedAt: now,
    paidAt: null
  }
}

export const confirmPaidOrder = (order: Order, paymentId: string): Order => ({
  ...order,
  paymentStatus: 'paid',
  orderStatus: 'confirmed',
  deliveryStatus: order.pickupType === 'delivery' ? 'ready' : 'pickup-ready',
  portonePaymentId: paymentId,
  paymentId,
  paidAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

export const failOrderPayment = (order: Order): Order => ({
  ...order,
  paymentStatus: 'failed',
  orderStatus: 'pending',
  updatedAt: new Date().toISOString()
})
