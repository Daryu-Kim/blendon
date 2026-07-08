export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;
  const auth = useAuthStore();
  await auth.init();
  if (!auth.isLoggedIn) {
    return navigateTo({ path: "/login", query: { redirect: to.fullPath } });
  }
  if (
    auth.profile?.mustChangePassword &&
    to.path !== "/account/change-password"
  ) {
    return navigateTo({
      path: "/account/change-password",
      query: { redirect: to.fullPath },
    });
  }
});
