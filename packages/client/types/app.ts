// アプリのステータス
export enum AppStatus {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
  PRIVATE = 'PRIVATE',
  ARCHIVED = 'ARCHIVED',
  SUSPENDED = 'SUSPENDED',
}

// アプリの基本情報
export interface App {
  id: number;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  subImageUrls?: string[];
  status: AppStatus;
  isSubscriptionOnly: boolean;
  appUrl?: string;
  createdAt: string;
  updatedAt: string;
  categoryId?: number;
  tags?: string[];
  usageCount?: number;
  likeRatio?: number;
  bookmarkCount?: number;
}

// アプリ一覧の結果
export interface PaginatedAppsResult {
  data: App[];
  total: number;
  page: number;
  limit: number;
}

// カテゴリ
export interface Category {
  id: number;
  name: string;
}

// タグ
export interface Tag {
  id: number;
  name: string;
} 
