import { buildPendingOrder } from '~/server/utils/order-service'
import { saveServerOrder } from '~/server/utils/order-store'
import { getFirebaseAdmin } from '~/server/utils/firebase-admin'
import { mockProducts } from '~/data/mock'
import type { CartItem, PaymentMethod, Product, UserProfile } from '~/types/domain'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    user: UserProfile
    cartItems: CartItem[]
    checkout: {
      recipientName: string
      recipientPhone: string
      address: { zipCode: string; address1: string; address2: string }
      deliveryMemo: string
      pickupType: 'delivery' | 'store-pickup' | 'lounge-pickup'
      pointUsed: number
      paymentMethod: PaymentMethod
    }
  }>(event)

  const admin = getFirebaseAdmin()
  const runtime = useRuntimeConfig()
  let user = body.user
  let products: Product[]

  if (admin) {
    const token = getHeader(event, 'authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) throw createError({ statusCode: 401, statusMessage: '인증 토큰이 필요합니다.' })
    const decoded = await admin.auth.verifyIdToken(token)
    const userSnap = await admin.db.collection('users').doc(decoded.uid).get()
    if (!userSnap.exists) throw createError({ statusCode: 404, statusMessage: '회원 정보를 찾을 수 없습니다.' })
    user = userSnap.data() as UserProfile
    const productDocs = await Promise.all(body.cartItems.map((item) => admin.db.collection('products').doc(item.productId).get()))
    products = productDocs.filter((snap) => snap.exists).map((snap) => ({ id: snap.id, ...snap.data() }) as Product)
  } else if (runtime.public.enableMockAuth) {
    products = mockProducts
  } else {
    throw createError({ statusCode: 500, statusMessage: 'Firebase Admin 설정이 필요합니다.' })
  }

  const order = buildPendingOrder(user, body.cartItems, body.checkout, products)
  return saveServerOrder(order)
})
