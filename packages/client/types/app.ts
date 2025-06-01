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

// アプリ評価情報
export interface AppRatingInfo {
  likeCount: number;
  dislikeCount: number;
  totalRatingCount: number;
  positiveRatingRate: number;
}

// アプリ基本情報
export interface AppDto extends AppRatingInfo {
  id: number;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  appUrl: string;
  categoryId: number;
  categoryName: string;
  developerId: number;
  developerName: string;
  developerAvatarUrl?: string | null;
  status: AppStatus;
  isSubscriptionLimited: boolean;
  createdAt: string;
  updatedAt: string;
  tags: AppTag[];
  usageCount: number;
  bookmarkCount: number;
  likesCount: number;
  dislikesCount: number;
}

// アプリ詳細情報
export interface AppDetailDto extends AppDto {
  resultReason: string | null;
  isBookmarked?: boolean;
  isLiked?: boolean;
  isDisliked?: boolean;
}

// アプリカードコンポーネント用の表示データ
export interface AppCardData {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  likes: number;
  dislikes: number;
  usageCount: number;
  requiresSubscription: boolean;
  creatorId: number | null;
  creatorName?: string;
  creatorAvatarUrl?: string | null;
  category?: {
    id: number;
    name: string;
  } | null;
  positiveRatingRate: number | null;
  totalRatingCount: number;
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
