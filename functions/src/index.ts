import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

initializeApp()

const db = getFirestore()

const adminRoles = ['manager', 'admin', 'owner']

const requireAuth = (request: { auth?: { uid: string; token: Record<string, unknown> } }) => {
  if (!request.auth) throw new HttpsError('unauthenticated', '로그인이 필요합니다.')
  return request.auth
}

const requireAdmin = (request: { auth?: { uid: string; token: Record<string, unknown> } }) => {
  const auth = requireAuth(request)
  if (!adminRoles.includes(String(auth.token.role || 'customer'))) {
    throw new HttpsError('permission-denied', '관리자 권한이 필요합니다.')
  }
  return auth
}

export const mockAdultVerification = onCall(async (request) => {
  const auth = requireAuth(request)
  const birthDate = String(request.data?.birthDate || '')
  const birth = new Date(`${birthDate}T00:00:00+09:00`)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1
  if (Number.isNaN(birth.getTime()) || age < 19) {
    throw new HttpsError('permission-denied', '성인 인증 대상이 아닙니다.')
  }

  const verifiedAt = FieldValue.serverTimestamp()
  await db.collection('users').doc(auth.uid).set(
    {
      birthDate,
      isAdultVerified: true,
      adultVerifiedAt: verifiedAt,
      adultVerificationProvider: 'mock',
      updatedAt: verifiedAt
    },
    { merge: true }
  )
  await db.collection('adultVerificationLogs').add({
    userId: auth.uid,
    provider: 'mock',
    status: 'verified',
    birthDate,
    requestedAt: verifiedAt,
    verifiedAt
  })

  return { ok: true }
})

export const verifyPortOnePayment = onCall(async (request) => {
  const auth = requireAuth(request)
  const orderId = String(request.data?.orderId || '')
  const paymentId = String(request.data?.paymentId || '')
  if (!orderId || !paymentId) throw new HttpsError('invalid-argument', '주문 또는 결제 식별자가 없습니다.')

  const orderRef = db.collection('orders').doc(orderId)
  const orderSnap = await orderRef.get()
  if (!orderSnap.exists) throw new HttpsError('not-found', '주문을 찾을 수 없습니다.')
  const order = orderSnap.data()
  if (order?.userId !== auth.uid) throw new HttpsError('permission-denied', '본인 주문만 확인할 수 있습니다.')

  const secret = process.env.PORTONE_API_SECRET
  if (!secret) throw new HttpsError('failed-precondition', 'PortOne secret is not configured.')

  const response = await fetch(`https://api.portone.io/payments/${paymentId}`, {
    headers: { Authorization: `PortOne ${secret}` }
  })
  if (!response.ok) throw new HttpsError('internal', 'PortOne payment lookup failed.')
  const payment = await response.json() as { status?: string; amount?: { total?: number; paid?: number }; paidAmount?: number }
  const paidAmount = payment.amount?.paid ?? payment.amount?.total ?? payment.paidAmount ?? 0
  if (String(payment.status || '').toUpperCase().includes('PAID') && paidAmount === order?.totalAmount) {
    await db.runTransaction(async (tx) => {
      tx.update(orderRef, {
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        portonePaymentId: paymentId,
        paidAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      })
      for (const item of order?.items || []) {
        const productRef = db.collection('products').doc(item.productId)
        tx.update(productRef, { stock: FieldValue.increment(-item.quantity), updatedAt: FieldValue.serverTimestamp() })
      }
    })
    return { ok: true }
  }

  await orderRef.update({ paymentStatus: 'failed', updatedAt: FieldValue.serverTimestamp() })
  throw new HttpsError('failed-precondition', '결제 금액 또는 상태가 일치하지 않습니다.')
})

export const setInitialAdminClaim = onCall(async (request) => {
  requireAdmin(request)
  const email = String(request.data?.email || process.env.ADMIN_INITIAL_EMAIL || '')
  if (!email) throw new HttpsError('invalid-argument', '관리자 이메일이 필요합니다.')
  const user = await getAuth().getUserByEmail(email)
  await getAuth().setCustomUserClaims(user.uid, { role: 'admin' })
  await db.collection('users').doc(user.uid).set({ role: 'admin', updatedAt: FieldValue.serverTimestamp() }, { merge: true })
  return { ok: true, uid: user.uid }
})
