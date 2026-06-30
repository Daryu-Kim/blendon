import { FieldValue } from 'firebase-admin/firestore'
import { getFirebaseAdmin } from '~/server/utils/firebase-admin'

const isAdult = (birthDate: string) => {
  const birth = new Date(`${birthDate}T00:00:00+09:00`)
  if (Number.isNaN(birth.getTime())) return false
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1
  return age >= 19
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ userId: string; birthDate: string; idToken?: string }>(event)
  if (!body.userId) throw createError({ statusCode: 401, statusMessage: '로그인 후 진행해 주세요.' })
  if (!isAdult(body.birthDate)) {
    throw createError({ statusCode: 403, statusMessage: '성인 인증 대상이 아닙니다.' })
  }

  const admin = getFirebaseAdmin()
  if (admin) {
    if (!body.idToken) throw createError({ statusCode: 401, statusMessage: '인증 토큰이 필요합니다.' })
    const decoded = await admin.auth.verifyIdToken(body.idToken)
    if (decoded.uid !== body.userId) throw createError({ statusCode: 403, statusMessage: '본인 계정만 확인할 수 있습니다.' })

    const verifiedAt = FieldValue.serverTimestamp()
    await admin.db.collection('users').doc(body.userId).set(
      {
        birthDate: body.birthDate,
        isAdultVerified: true,
        adultVerifiedAt: verifiedAt,
        adultVerificationProvider: 'mock',
        updatedAt: verifiedAt
      },
      { merge: true }
    )
    await admin.db.collection('adultVerificationLogs').add({
      userId: body.userId,
      provider: 'mock',
      status: 'verified',
      birthDate: body.birthDate,
      requestedAt: verifiedAt,
      verifiedAt
    })
  }

  // Production path: replace this adapter with PortOne identity verification or another provider.
  return {
    ok: true,
    provider: 'mock',
    verifiedAt: new Date().toISOString()
  }
})
