import type { PaginatedResult, BaseParams } from './common';

// アプリステータス
export enum AppStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  PRIVATE = 'PRIVATE',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED'
}

// アプリタグ
export interface AppTag {
  id: number;
  name: string;
}

// アプリ基本情報
export interface AppDto {
  id: number;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  appUrl: string;
  categoryId: number;
  categoryName: string;
  developerId: number;
  developerName: string;
  status: AppStatus;
  isSubscriptionLimited: boolean;
  createdAt: string;
  updatedAt: string;
  tags: AppTag[];
  usageCount: number;
  likeCount: number;
  dislikeCount: number;
  bookmarkCount: number;
}

// アプリ詳細情報
export interface AppDetailDto extends AppDto {
  resultReason: string | null;
}

// アプリフィルターパラメータ
export interface AppFilterParams extends BaseParams {
  categoryId?: number;
  tagIds?: number[];
}

// カテゴリー
export interface CategoryDto {
  id: number;
  name: string;
  description: string | null;
  appCount: number;
  createdAt: string;
  updatedAt: string;
}

// タグ
export interface TagDto {
  id: number;
  name: string;
  appCount: number;
  createdAt: string;
  updatedAt: string;
}

// レスポンス型
export type AppListResponse = PaginatedResult<AppDto>;
export type CategoryListResponse = PaginatedResult<CategoryDto>;
export type TagListResponse = PaginatedResult<TagDto>; 
