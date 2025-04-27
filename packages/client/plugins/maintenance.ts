import { defineNuxtPlugin, useState } from '#app';

export default defineNuxtPlugin(() => {
  // 'isMaintenanceMode' というキーで boolean 型の状態を定義
  // デフォルト値を true に設定（メンテナンスモード有効）
  // TODO: 実際の運用では環境変数やAPIから値を取得するように変更
  const isMaintenanceMode = useState<boolean>('isMaintenanceMode', () => false);

  // 必要に応じて、ここで環境変数などから初期値を設定できます
  // const config = useRuntimeConfig();
  // isMaintenanceMode.value = config.public.maintenanceMode || false;

  console.log(`Maintenance mode status initialized: ${isMaintenanceMode.value}`);
}); 
