export default defineNuxtRouteMiddleware(async (to, from) => {
  const nuxtApp = useNuxtApp();
  const { $api, $storage } = nuxtApp;
  const token = $storage.getItem('access_token');

  if (!token) {
    nuxtApp.payload.user = { id: 0, email: '', name: '', avatarUrl: '', role: '', planName: '', developerStatus: 'UNSUBMITTED', createdAt: '', updatedAt: '', status: '' };
    nuxtApp.payload.isLoggedIn = false;
    nuxtApp.payload.isAdministrator = false;
    nuxtApp.payload.isDeveloper = false;
    nuxtApp.payload.isUser = false;
    return;
  }

  try {
    const response = await $api.get('/me/profile');
    const authenticatedUser = response.data;
    nuxtApp.payload.user = authenticatedUser;
    nuxtApp.payload.isLoggedIn = true;
    nuxtApp.payload.isAdministrator = authenticatedUser.role === 'ADMINISTRATOR';
    nuxtApp.payload.isDeveloper = authenticatedUser.role === 'DEVELOPER';
    nuxtApp.payload.isUser = authenticatedUser.role === 'User';
    return;
  } catch (err) {
    alert('認証に失敗しました。');
    $storage.removeItem('access_token');
  }
});
