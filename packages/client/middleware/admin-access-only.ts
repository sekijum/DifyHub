import { defineNuxtRouteMiddleware, navigateTo } from '#app';

export default defineNuxtRouteMiddleware((to, from) => {
  const nuxtApp = useNuxtApp();
  const { payload } = nuxtApp;

  if (!payload.isAdmin) {
    return navigateTo('/signin');
  }
});
