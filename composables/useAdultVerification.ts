export const useAdultVerification = () => {
  const auth = useAuthStore()
  const loading = ref(false)
  const error = ref('')

  const verifyWithMockProvider = async (birthDate: string) => {
    if (!auth.profile) throw new Error('로그인 후 성인 인증을 진행해 주세요.')
    loading.value = true
    error.value = ''
    try {
      const result = await $fetch<{ ok: boolean; provider: string; verifiedAt: string }>('/api/adult-verifications/mock', {
        method: 'POST',
        body: {
          userId: auth.profile.uid,
          birthDate,
          idToken: await useNuxtApp().$firebase.auth?.currentUser?.getIdToken()
        }
      })
      if (!result.ok) throw new Error('성인 인증에 실패했어요.')
      await auth.markAdultVerified(result.provider, birthDate)
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : '성인 인증에 실패했어요.'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { loading, error, verifyWithMockProvider }
}
