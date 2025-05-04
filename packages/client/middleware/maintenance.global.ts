export default defineNuxtRouteMiddleware((to, from) => {
  // プラグインで定義したメンテナンスモードの状態を取得
  const isMaintenanceMode = useState<boolean>('isMaintenanceMode');

  // 現在のパスが /admin で始まるか、または /maintenance 自体かを確認
  const isAdminRoute = to.path.startsWith('/admin');
  const isMaintenanceRoute = to.path === '/maintenance';

  // Case 1: Maintenance mode is ON
  // メンテナンスモードが有効 かつ 管理画面ルートでなく かつ メンテナンス画面自体でない場合
  if (isMaintenanceMode.value && !isAdminRoute && !isMaintenanceRoute) {
    console.log(`Maintenance mode active. Redirecting from ${to.path} to /maintenance.`);
    // /maintenance へリダイレクト (307 Temporary Redirect)
    return navigateTo('/maintenance', { redirectCode: 307 });
  }

  // Case 2: Maintenance mode is OFF, but user tries to access /maintenance
  // メンテナンスモードが無効 かつ アクセス先が /maintenance の場合
  if (!isMaintenanceMode.value && isMaintenanceRoute) {
    const previousPath = from.fullPath;
    // 直前のパスが存在し、かつそれが /maintenance でなければそこへ、そうでなければルートへリダイレクト
    const redirectTo = previousPath && previousPath !== '/maintenance' ? previousPath : '/';
    console.log(`Maintenance mode inactive. Redirecting from /maintenance to ${redirectTo}.`);
    // 直前のページまたはルートへリダイレクト (307 Temporary Redirect)
    return navigateTo(redirectTo, { redirectCode: 307 });
  }

  // Other cases: Allow navigation (no return value needed)
}); 
