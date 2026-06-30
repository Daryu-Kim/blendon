export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return
  const auth = useAuthStore()
  await auth.init()
  if (!auth.isAdmin) {
    const toast = useToast()
    toast.show('관리자 권한이 필요한 페이지입니다.', 'warning')
    return navigateTo({ path: '/', query: { notice: 'admin-forbidden' } }, { replace: true })
  }
})
