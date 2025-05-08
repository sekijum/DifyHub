// ユーザーロール
export type UserRole = "ADMINISTRATOR" | "DEVELOPER" | "USER";

// ユーザーステータス
export type UserStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | "BLOCKED";

// 開発者ステータス
export type DeveloperStatus = 'UNSUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

// ユーザープロフィール（自分）
export interface MyProfile {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  planName: string;
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
  status: UserStatus;
  developerStatus: DeveloperStatus;
}

// ログインレスポンス
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
}

// ユーザープロフィール（一般）
export interface UserProfile {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}
