import type { UserRole, UserStatus, UserProfile, LoginResponse } from '~/types/user';
import type { DeveloperRequestStatus } from '~/types/developer';

/**
 * ユーザー関連APIのcomposable
 */
export function useUserApi() {
  const { $api } = useNuxtApp();

  // ---------- 共通型定義 ----------

  // ---------- ユーザー認証関連 API ----------

  /**
   * ログイン処理
   */
  async function login(data: {
    email: string;
    password: string;
  }) {
    return $api<LoginResponse>(`/auth/login`, {
      method: 'POST',
      data
    });
  }

  /**
   * 新規ユーザー登録
   */
  async function signup(data: {
    email: string;
    password: string;
    name: string;
  }) {
    return $api<UserProfile>(`/auth/register`, {
      method: 'POST',
      data
    });
  }

  /**
   * メールアドレス確認
   */
  async function verifyEmail(token: string) {
    return $api<{ success: boolean }>(`/auth/verify-email`, {
      method: 'POST',
      data: { token }
    });
  }

  /**
   * パスワードリセットリクエスト
   */
  async function requestPasswordReset(data: { email: string }) {
    return $api<{ success: boolean }>(`/auth/request-password-reset`, {
      method: 'POST',
      data
    });
  }

  /**
   * パスワードリセット実行
   */
  async function resetPassword(data: { 
    token: string;
    password: string;
  }) {
    return $api<{ success: boolean }>(`/auth/reset-password`, {
      method: 'POST',
      data
    });
  }

  /**
   * リフレッシュトークンでのアクセストークン更新
   */
  async function refreshToken(refreshToken: string) {
    return $api<{ access_token: string }>(`/auth/refresh`, {
      method: 'POST',
      data: { refreshToken }
    });
  }

  // ---------- 開発者申請関連 API ----------

  /**
   * 開発者申請の送信
   */
  async function createDeveloperRequest(data: {
    reason: string;
    portfolioUrl?: string;
  }) {
    return $api<{ success: boolean; requestId: number }>(`/user/developer-request`, {
      method: 'POST',
      data
    });
  }

  /**
   * 開発者申請ステータスの確認
   */
  async function findDeveloperRequestStatus() {
    return $api<{
      status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
      requestId?: number;
      resultReason?: string;
      createdAt?: string;
    }>(`/user/developer-request-status`, {
      method: 'GET'
    });
  }

  return {
    // 認証
    login,
    signup,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    refreshToken,
    
    // 開発者申請
    createDeveloperRequest,
    findDeveloperRequestStatus,
  };
} 
