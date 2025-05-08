import type { PaginatedResult } from './common';

// 開発者プロフィール
export interface DeveloperProfile {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  developerName: string | null;
  bio: string | null;
  role: string;
  createdAt: string;
}

// 開発者ダッシュボード統計情報
export interface DashboardStats {
  appCount: number;
  totalUsage: number;
  totalLikes: number;
  totalBookmarks: number;
  totalApproximateRevenue: number;
  recentApps: {
    id: number;
    name: string;
    thumbnailUrl: string | null;
    usageCount: number;
    createdAt: string;
  }[];
  monthlyUsageStats: {
    month: string;
    count: number;
  }[];
}

// アプリ統計情報
export interface AppStatistics {
  usageCount: number;
  likesCount: number;
  dislikesCount: number;
  bookmarksCount: number;
  monthlyUsage: {
    month: string;
    count: number;
  }[];
  categoryDistribution: {
    categoryName: string;
    percentage: number;
  }[];
}

// 開発者申請
export interface DeveloperRequest {
  id: number;
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  reason: string;
  portfolioUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  resultReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// 開発者申請ステータス
export interface DeveloperRequestStatus {
  status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  requestId?: number;
  resultReason?: string;
  createdAt?: string;
}

// 開発者申請リスト
export type DeveloperRequestListResponse = PaginatedResult<DeveloperRequest>; 
