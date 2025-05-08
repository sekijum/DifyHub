import type { PaginatedResult, BaseParams } from '~/types/common';
import type { AppDto, AppDetailDto, CategoryDto, AppFilterParams, AppListResponse } from '~/types/app';
import type { NotificationItem, NotificationListResponse } from '~/types/notification';

/**
 * 公開APIアクセス用のcomposable
 */
export function usePublicApi() {
  const { $api } = useNuxtApp();

  // ---------- アプリ関連 ----------

  /**
   * アプリ一覧を取得
   */
  async function findAllApps(params?: AppFilterParams & { status?: string }) {
    return $api<AppListResponse>(`/apps`, {
      method: 'GET',
      params
    });
  }

  /**
   * アプリ詳細を取得
   */
  async function findAppById(id: number) {
    return $api<AppDetailDto>(`/apps/${id}`, {
      method: 'GET'
    });
  }

  // ---------- カテゴリー関連 ----------

  /**
   * カテゴリー一覧を取得
   */
  async function findAllCategories(params?: BaseParams) {
    return $api<CategoryDto[]>(`/categories`, {
      method: 'GET',
      params
    });
  }

  /**
   * カテゴリー詳細を取得
   */
  async function findCategoryById(id: number) {
    return $api<CategoryDto>(`/categories/${id}`, {
      method: 'GET'
    });
  }

  // ---------- 通知関連 ----------

  /**
   * 通知一覧を取得
   */
  async function findAllNotifications(params?: BaseParams) {
    return $api<NotificationListResponse>(`/notifications`, {
      method: 'GET',
      params
    });
  }

  /**
   * トップページ表示用の通知を取得
   */
  async function findTopNotifications() {
    return $api<NotificationItem[]>(`/notifications/top`, {
      method: 'GET'
    });
  }

  return {
    // アプリ
    findAllApps,
    findAppById,
    
    // カテゴリー
    findAllCategories,
    findCategoryById,
    
    // 通知
    findAllNotifications,
    findTopNotifications
  };
} 
