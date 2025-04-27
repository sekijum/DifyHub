import { defineNuxtRouteMiddleware } from '#app';

export default defineNuxtRouteMiddleware(async (to, from) => {
  const nuxtApp = useNuxtApp();
  const { $api, $storage } = nuxtApp;

  const token = $storage.getItem('access_token');

  if (!token) {
    nuxtApp.payload.user = null;
    nuxtApp.payload.isLoggedIn = false;
    nuxtApp.payload.isAdmin = false;
    nuxtApp.payload.isMember = false;
    return;
  }

  try {
    const response = await $api.get('/users/me');
    const authenticatedUser = response.data;
    nuxtApp.payload.user = authenticatedUser;
    nuxtApp.payload.isLoggedIn = true;
    nuxtApp.payload.isAdmin = authenticatedUser.role === 'Admin';
    nuxtApp.payload.isMember = authenticatedUser.role === 'Member';
    return;
  } catch (err) {
    // alert('認証に失敗しました。');
    // $storage.removeItem('access_token');
  }
});
