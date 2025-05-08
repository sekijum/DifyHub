import type { PaginatedResult, BaseParams } from '~/types/common';
import type { MyProfile, UserRole, UserStatus, DeveloperStatus } from '~/types/user';
import type { NotificationSettings } from '~/types/notification';

/**
 * ログインユーザー自身のプロフィール管理用APIのcomposable
 */
export function useMeApi() {
  const { $api } = useNuxtApp();

  // ---------- 型定義 ----------

  interface BookmarkItem {
    id: number;
    app: {
      id: number;
      name: string;
      description: string;
      thumbnailUrl: string | null;
      categoryId: number;
      categoryName: string;
      developerName: string;
    };
    createdAt: string;
  }

  type BookmarkListResponse = PaginatedResult<BookmarkItem>;

  interface AppUsageItem {
    id: number;
    app: {
      id: number;
      name: string;
      thumbnailUrl: string | null;
    };
    usedAt: string;
  }

  type AppUsageHistoryResponse = PaginatedResult<AppUsageItem>;

  // ---------- プロフィール関連 API ----------

  /**
   * 自分のプロフィール情報を取得
   */
  async function findMyProfile() {
    return $api<MyProfile>(`/me/profile`, {
      method: 'GET'
    });
  }

  /**
   * プロフィール情報を更新
   */
  async function updateProfile(data: {
    name?: string;
    avatarUrl?: string | null;
  }) {
    return $api<MyProfile>(`/me/profile`, {
      method: 'PATCH',
      data
    });
  }

  /**
   * パスワード変更
   */
  async function changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }) {
    return $api<{ success: boolean }>(`/me/change-password`, {
      method: 'POST',
      data
    });
  }

  /**
   * メールアドレス変更リクエスト
   */
  async function requestEmailChange(data: { newEmail: string }) {
    return $api<{ success: boolean }>(`/me/request-email-change`, {
      method: 'POST',
      data
    });
  }

  /**
   * メールアドレス変更の確認
   */
  async function confirmEmailChange(token: string) {
    return $api<{ success: boolean }>(`/me/confirm-email-change`, {
      method: 'POST',
      data: { token }
    });
  }

  // ---------- お気に入り関連 API ----------

  /**
   * ブックマーク一覧を取得
   */
  async function findAllBookmarks(params?: BaseParams) {
    return $api<BookmarkListResponse>(`/me/bookmarks`, {
      method: 'GET',
      params
    });
  }

  /**
   * アプリをブックマークに追加
   */
  async function createBookmark(appId: number) {
    return $api<{ success: boolean; bookmarkId: number }>(`/me/bookmarks`, {
      method: 'POST',
      data: { appId }
    });
  }

  /**
   * アプリのブックマークを削除
   */
  async function deleteBookmark(appId: number) {
    return $api<{ success: boolean }>(`/me/bookmarks/${appId}`, {
      method: 'DELETE'
    });
  }

  // ---------- 通知設定関連 API ----------

  /**
   * 通知設定を取得
   */
  async function findNotificationSettings() {
    return $api<NotificationSettings>(`/me/notification-settings`, {
      method: 'GET'
    });
  }

  /**
   * 通知設定を更新
   */
  async function updateNotificationSettings(data: Partial<NotificationSettings>) {
    return $api<NotificationSettings>(`/me/notification-settings`, {
      method: 'PATCH',
      data
    });
  }

  // ---------- 利用履歴関連 API ----------

  /**
   * アプリ利用履歴を取得
   */
  async function findAllAppUsageHistory(params?: BaseParams) {
    return $api<AppUsageHistoryResponse>(`/me/app-usage-history`, {
      method: 'GET',
      params
    });
  }

  // ---------- 開発者申請関連 API ----------

  /**
   * 開発者申請を送信
   */
  async function createDeveloperRequest(data: {
    reason: string;
    portfolioUrl?: string;
  }) {
    return $api<{ success: boolean; requestId: number }>(`/me/developer-request`, {
      method: 'POST',
      data
    });
  }

  return {
    // プロフィール
    findMyProfile,
    updateProfile,
    changePassword,
    requestEmailChange,
    confirmEmailChange,
    
    // ブックマーク
    findAllBookmarks,
    createBookmark,
    deleteBookmark,
    
    // 通知設定
    findNotificationSettings,
    updateNotificationSettings,
    
    // 利用履歴
    findAllAppUsageHistory,
    
    // 開発者申請
    createDeveloperRequest,
  };
} 
