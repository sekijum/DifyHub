import { App, User, Category } from '@prisma/client';

// Userの一部情報を含む型 (ネストされたリレーション用)
// App 型に include で creator を含めた場合の型を補助的に定義
type AppWithIncludedDataAndCounts = App & { 
  creator?: Pick<User, 'id' | 'name' | 'avatarUrl'> | null; 
  category?: Pick<Category, 'id' | 'name'> | null;
  likesCount?: number;
  dislikesCount?: number;
};

export class AppDto {
  id: number;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  usageCount: number;
  createdAt: Date;
  categoryId: number | null;
  category?: { id: number; name: string } | null;
  isSubscriptionLimited: boolean;
  creatorId?: number;
  creatorName?: string;
  creatorAvatarUrl?: string | null;
  likesCount: number;
  dislikesCount: number;

  // Prisma モデル (creator情報を含む) からマッピングするコンストラクタ
  constructor(partial: Partial<AppWithIncludedDataAndCounts>) {
    this.id = partial.id;
    this.name = partial.name;
    this.description = partial.description;
    this.thumbnailUrl = partial.thumbnailUrl;
    this.usageCount = partial.usageCount;
    this.createdAt = partial.createdAt;
    this.categoryId = partial.categoryId;
    this.category = partial.category ? { id: partial.category.id, name: partial.category.name } : null;
    this.isSubscriptionLimited = partial.isSubscriptionLimited ?? false;
    this.creatorId = partial.creator?.id;
    this.creatorName = partial.creator?.name;
    this.creatorAvatarUrl = partial.creator?.avatarUrl;
    this.likesCount = partial.likesCount ?? 0;
    this.dislikesCount = partial.dislikesCount ?? 0;
  }

  // 静的ファクトリメソッド (型安全性を高める)
  static fromEntity(entity: AppWithIncludedDataAndCounts): AppDto {
      const dto = new AppDto(entity);
      // 必要に応じて追加の変換を実行
      return dto;
  }
} 
