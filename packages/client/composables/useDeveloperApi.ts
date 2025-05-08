import type { PaginatedResult, BaseParams } from '~/types/common';
import type { AppStatus, AppDto, AppDetailDto, AppFilterParams, AppListResponse, AppTag } from '~/types/app';
import type { DeveloperProfile, DashboardStats, AppStatistics } from '~/types/developer';

/**
 * 開発者向けAPIのcomposable
 */
export function useDeveloperApi() {
  const { $api } = useNuxtApp();

  // ---------- 開発者プロフィール関連 API ----------

  /**
   * 開発者プロフィールを取得
   */
  async function findDeveloperProfile() {
    return $api<DeveloperProfile>(`/developer/profile`, {
      method: 'GET'
    });
  }

  /**
   * 開発者プロフィールを更新
   */
  async function updateDeveloperProfile(data: {
    developerName?: string;
    bio?: string;
  }) {
    return $api<DeveloperProfile>(`/developer/profile`, {
      method: 'PATCH',
      data
    });
  }

  // ---------- 開発者ダッシュボード関連 API ----------

  /**
   * ダッシュボード統計情報を取得
   */
  async function findDashboardStats() {
    return $api<DashboardStats>(`/developer/dashboard-stats`, {
      method: 'GET'
    });
  }

  // ---------- 開発者アプリ関連 API ----------

  /**
   * 開発者のアプリ一覧を取得
   */
  async function findAllApps(params?: AppFilterParams & { status?: AppStatus }) {
    return $api<AppListResponse>(`/developer/apps`, {
      method: 'GET',
      params
    });
  }

  /**
   * 開発者のアプリ詳細を取得
   */
  async function findAppById(id: number) {
    return $api<AppDetailDto>(`/developer/apps/${id}`, {
      method: 'GET'
    });
  }

  interface CreateAppDto {
    name: string;
    description?: string;
    categoryId: number;
    appUrl: string;
    thumbnailUrl?: string | null;
    tags?: number[];
    isSubscriptionLimited?: boolean;
  }

  /**
   * アプリを作成
   */
  async function createApp(data: CreateAppDto) {
    const formData = new FormData();
    
    // 通常のフィールド
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    formData.append('categoryId', data.categoryId.toString());
    formData.append('appUrl', data.appUrl);
    if (data.isSubscriptionLimited !== undefined) 
      formData.append('isSubscriptionLimited', data.isSubscriptionLimited.toString());
    
    // タグ（複数）
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach((tagId) => {
        formData.append('tags', tagId.toString());
      });
    }
    
    // サムネイル画像がある場合
    if (data.thumbnailUrl) {
      // 実際のアップロード処理に合わせて修正する必要があるかもしれません
    }

    return $api<AppDetailDto>(`/developer/apps`, {
      method: 'POST',
      data: formData
    });
  }

  interface UpdateAppDto {
    name?: string;
    description?: string;
    categoryId?: number;
    appUrl?: string;
    thumbnailUrl?: string | null;
    tags?: number[];
    isSubscriptionLimited?: boolean;
    status?: AppStatus;
  }

  /**
   * アプリを更新
   */
  async function updateApp(id: number, data: UpdateAppDto) {
    const formData = new FormData();
    
    // 基本データの設定
    if (data.name) formData.append('name', data.name);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.categoryId) formData.append('categoryId', data.categoryId.toString());
    if (data.appUrl) formData.append('appUrl', data.appUrl);
    if (data.isSubscriptionLimited !== undefined) 
      formData.append('isSubscriptionLimited', data.isSubscriptionLimited.toString());
    if (data.status) formData.append('status', data.status);
    
    // タグ（複数）
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach((tagId) => {
        formData.append('tags', tagId.toString());
      });
    }
    
    // サムネイル画像の更新
    if (data.thumbnailUrl) {
      // 実際のアップロード処理に合わせて修正する必要があるかもしれません
    }

    return $api<AppDetailDto>(`/developer/apps/${id}`, {
      method: 'PATCH',
      data: formData
    });
  }

  /**
   * アプリを削除
   */
  async function deleteApp(id: number) {
    return $api<{ success: boolean }>(`/developer/apps/${id}`, {
      method: 'DELETE'
    });
  }

  // ---------- アプリ統計情報 API ----------

  /**
   * アプリの統計情報を取得
   */
  async function findAppStatistics(id: number) {
    return $api<AppStatistics>(`/developer/apps/${id}/statistics`, {
      method: 'GET'
    });
  }

  return {
    // 開発者プロフィール
    findDeveloperProfile,
    updateDeveloperProfile,
    
    // ダッシュボード
    findDashboardStats,
    
    // アプリ
    findAllApps,
    findAppById,
    createApp,
    updateApp,
    deleteApp,
    findAppStatistics,
  };
} 
