import type { PaginatedResult, BaseParams } from '~/types/common';
import type { 
  AppStatus, AppDto, AppDetailDto, AppFilterParams, 
  CategoryDto, TagDto, AppListResponse, CategoryListResponse, TagListResponse 
} from '~/types/app';
import type { UserRole, UserStatus, MyProfile } from '~/types/user';
import type { NotificationLevel, NotificationItem, NotificationListResponse } from '~/types/notification';
import type { DeveloperRequest, DeveloperRequestListResponse } from '~/types/developer';

/**
 * 管理者向けAPIのcomposable
 */
export function useAdminApi() {
  const { $api } = useNuxtApp();

  // ---------- 型定義 ----------

  type UserListResponse = PaginatedResult<MyProfile>;

  // ---------- カテゴリー関連 API ----------

  /**
   * カテゴリー一覧を取得
   */
  async function findAllCategories(params?: BaseParams) {
    return $api<CategoryListResponse>(`/admin/categories`, {
      method: 'GET',
      params
    });
  }

  /**
   * カテゴリー詳細を取得
   */
  async function findCategoryById(id: number) {
    return $api<CategoryDto>(`/admin/categories/${id}`, {
      method: 'GET'
    });
  }

  /**
   * カテゴリーを作成
   */
  async function createCategory(data: { 
    name: string; 
    description?: string;
  }) {
    return $api<CategoryDto>(`/admin/categories`, {
      method: 'POST',
      data
    });
  }

  /**
   * カテゴリーを更新
   */
  async function updateCategory(id: number, data: { 
    name?: string; 
    description?: string;
  }) {
    return $api<CategoryDto>(`/admin/categories/${id}`, {
      method: 'PATCH',
      data
    });
  }

  /**
   * カテゴリーを削除
   */
  async function deleteCategory(id: number) {
    return $api<{ success: boolean }>(`/admin/categories/${id}`, {
      method: 'DELETE'
    });
  }

  // ---------- タグ関連 API ----------

  /**
   * タグ一覧を取得
   */
  async function findAllTags(params?: BaseParams) {
    return $api<TagListResponse>(`/admin/tags`, {
      method: 'GET',
      params
    });
  }

  /**
   * タグ詳細を取得
   */
  async function findTagById(id: number) {
    return $api<TagDto>(`/admin/tags/${id}`, {
      method: 'GET'
    });
  }

  /**
   * タグを作成
   */
  async function createTag(data: { name: string }) {
    return $api<TagDto>(`/admin/tags`, {
      method: 'POST',
      data
    });
  }

  /**
   * タグを更新
   */
  async function updateTag(id: number, data: { name: string }) {
    return $api<TagDto>(`/admin/tags/${id}`, {
      method: 'PATCH',
      data
    });
  }

  /**
   * タグを削除
   */
  async function deleteTag(id: number) {
    return $api<{ success: boolean }>(`/admin/tags/${id}`, {
      method: 'DELETE'
    });
  }

  // ---------- アプリ関連 API ----------

  /**
   * アプリ一覧を取得
   */
  async function findAllApps(params?: AppFilterParams & { status?: AppStatus }) {
    return $api<AppListResponse>(`/admin/apps`, {
      method: 'GET',
      params
    });
  }

  /**
   * アプリ詳細を取得
   */
  async function findAppById(id: number) {
    return $api<AppDetailDto>(`/admin/apps/${id}`, {
      method: 'GET'
    });
  }

  /**
   * アプリステータスを更新
   */
  async function updateAppStatus(id: number, data: { 
    status: AppStatus; 
    resultReason?: string;
  }) {
    return $api<AppDetailDto>(`/admin/apps/${id}/status`, {
      method: 'PATCH',
      data
    });
  }

  // ---------- ユーザー関連 API ----------

  /**
   * 全ユーザー一覧を取得
   */
  async function findAllUsers(params?: BaseParams & { 
    role?: UserRole;
    status?: UserStatus;
  }) {
    return $api<UserListResponse>(`/admin/users`, {
      method: 'GET',
      params
    });
  }

  /**
   * ユーザー詳細を取得
   */
  async function findUserById(id: number) {
    return $api<MyProfile>(`/admin/users/${id}`, {
      method: 'GET'
    });
  }

  /**
   * ユーザーのステータスを更新
   */
  async function updateUserStatus(id: number, data: { 
    status: UserStatus; 
    reason?: string;
  }) {
    return $api<MyProfile>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      data
    });
  }

  /**
   * 管理者一覧を取得
   */
  async function findAllAdministrators(params?: BaseParams) {
    return $api<UserListResponse>(`/admin/administrators`, {
      method: 'GET',
      params
    });
  }

  /**
   * 管理者を追加
   */
  async function createAdministrator(data: { 
    email: string; 
    name: string;
    password: string;
  }) {
    return $api<MyProfile>(`/admin/administrators`, {
      method: 'POST',
      data
    });
  }

  /**
   * 管理者を更新
   */
  async function updateAdministrator(id: number, data: { 
    name?: string;
    password?: string;
  }) {
    return $api<MyProfile>(`/admin/administrators/${id}`, {
      method: 'PATCH',
      data
    });
  }

  /**
   * 管理者を削除
   */
  async function deleteAdministrator(id: number) {
    return $api<{ success: boolean }>(`/admin/administrators/${id}`, {
      method: 'DELETE'
    });
  }

  // ---------- 開発者申請関連 API ----------

  /**
   * 開発者申請一覧を取得
   */
  async function findAllDeveloperRequests(params?: BaseParams & {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  }) {
    return $api<DeveloperRequestListResponse>(`/admin/developer-requests`, {
      method: 'GET',
      params
    });
  }

  /**
   * 開発者申請詳細を取得
   */
  async function findDeveloperRequestById(id: number) {
    return $api<DeveloperRequest>(`/admin/developer-requests/${id}`, {
      method: 'GET'
    });
  }

  /**
   * 開発者申請のステータスを更新
   */
  async function updateDeveloperRequestStatus(id: number, data: { 
    status: 'APPROVED' | 'REJECTED'; 
    resultReason?: string;
  }) {
    return $api<DeveloperRequest>(`/admin/developer-requests/${id}/status`, {
      method: 'PATCH',
      data
    });
  }

  // ---------- 通知関連 API ----------

  /**
   * 通知一覧を取得
   */
  async function findAllNotifications(params?: BaseParams) {
    return $api<NotificationListResponse>(`/admin/notifications`, {
      method: 'GET',
      params
    });
  }

  /**
   * 通知詳細を取得
   */
  async function findNotificationById(id: number) {
    return $api<NotificationItem>(`/admin/notifications/${id}`, {
      method: 'GET'
    });
  }

  /**
   * 通知を作成
   */
  async function createNotification(data: { 
    title: string; 
    content: string;
    level: NotificationLevel;
    startAt: string;
    endAt?: string | null;
    isVisibleOnTop: boolean;
  }) {
    return $api<NotificationItem>(`/admin/notifications`, {
      method: 'POST',
      data
    });
  }

  /**
   * 通知を更新
   */
  async function updateNotification(id: number, data: { 
    title?: string; 
    content?: string;
    level?: NotificationLevel;
    startAt?: string;
    endAt?: string | null;
    isVisibleOnTop?: boolean;
  }) {
    return $api<NotificationItem>(`/admin/notifications/${id}`, {
      method: 'PATCH',
      data
    });
  }

  /**
   * 通知を削除
   */
  async function deleteNotification(id: number) {
    return $api<{ success: boolean }>(`/admin/notifications/${id}`, {
      method: 'DELETE'
    });
  }

  return {
    // カテゴリー
    findAllCategories,
    findCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,

    // タグ
    findAllTags,
    findTagById,
    createTag,
    updateTag,
    deleteTag,

    // アプリ
    findAllApps,
    findAppById,
    updateAppStatus,

    // ユーザー
    findAllUsers,
    findUserById,
    updateUserStatus,
    findAllAdministrators,
    createAdministrator,
    updateAdministrator,
    deleteAdministrator,

    // 開発者申請
    findAllDeveloperRequests,
    findDeveloperRequestById,
    updateDeveloperRequestStatus,

    // 通知
    findAllNotifications,
    findNotificationById,
    createNotification,
    updateNotification,
    deleteNotification,
  };
} 
