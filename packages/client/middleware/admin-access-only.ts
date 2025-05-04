export default defineNuxtRouteMiddleware((to, from) => {
  const nuxtApp = useNuxtApp();
  const { payload } = nuxtApp;

  if (!payload.isAdministrator) {
    return navigateTo('/signin');
  }
});
