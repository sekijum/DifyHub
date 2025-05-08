import type { PaginatedResult } from './common';

// 通知レベル
export type NotificationLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

// 通知アイテム
export interface NotificationItem {
  id: number;
  title: string;
  content: string;
  level: NotificationLevel;
  startAt: string;
  endAt: string | null;
  isVisibleOnTop: boolean;
  createdAt: string;
  updatedAt: string;
}

// 通知設定
export interface NotificationSettings {
  emailNotifications: boolean;
  appUpdateNotifications: boolean;
  marketingNotifications: boolean;
}

// 通知一覧レスポンス
export type NotificationListResponse = PaginatedResult<NotificationItem>; 
