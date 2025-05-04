import { App, User, Category, Tag, AppSubImage } from '@prisma/client';
import { AppDto } from './app.dto';

// User, Category, Tag, AppSubImage の一部を含む App の型を定義
type AppDetailEntity = App & {
  category?: Category | null;
  tags?: Tag[];
  subImages?: AppSubImage[];
  creator?: Pick<User, 'id' | 'name' | 'avatarUrl'> | null;
};

// 仮の関連DTO（必要であれば個別のファイルに定義）
interface CategoryDto {
  id: number;
  name: string;
  // PrismaのCategoryモデルに合わせる。description, createdAt等も必要なら追加
}

interface TagDto {
  id: number;
  name: string;
}

interface SubImageDto {
  id: number;
  imageUrl: string; // フィールド名を imageUrl に修正
}

export class AppDetailDto extends AppDto {
  category?: CategoryDto | null; // カテゴリー情報
  tags: TagDto[];              // タグ情報
  subImages: SubImageDto[];     // サブ画像情報
  creatorName?: string; // AppDtoから継承されるが、明示的に記述してもOK
  creatorAvatarUrl?: string | null; // AppDtoから継承されるが、明示的に記述してもOK

  // ユーザー固有情報 (認証時のみ)
  isBookmarked?: boolean;
  isLiked?: boolean;
  isDisliked?: boolean;

  // 集計情報
  likesCount: number;
  dislikesCount: number;
  bookmarksCount: number;

  // ★ updatedAt プロパティを追加
  updatedAt: Date;

  // Prisma Entity からマッピングするためのコンストラクタまたはファクトリメソッドを拡張
  // Prisma の include で取得される型に合わせる
  constructor(entity: AppDetailEntity) {
    super(entity);
    this.category = entity.category ? { id: entity.category.id, name: entity.category.name } : null;
    this.tags = entity.tags?.map(t => ({ id: t.id, name: t.name })) ?? [];
    this.subImages = entity.subImages?.map(si => ({ id: si.id, imageUrl: si.imageUrl })) ?? [];
    this.updatedAt = entity.updatedAt; // ★ constructor で updatedAt を設定
  }

  static fromEntity(entity: AppDetailEntity): AppDetailDto {
    const baseDto = AppDto.fromEntity(entity);
    
    const dto = new AppDetailDto(entity);
    Object.assign(dto, baseDto);

    dto.category = entity.category ? { id: entity.category.id, name: entity.category.name } : null;
    dto.tags = entity.tags?.map(t => ({ id: t.id, name: t.name })) ?? [];
    dto.subImages = entity.subImages?.map(si => ({ id: si.id, imageUrl: si.imageUrl })) ?? [];
    
    // ★ updatedAt を明示的にマッピング
    dto.updatedAt = entity.updatedAt;

    dto.likesCount = 0;
    dto.dislikesCount = 0;
    dto.bookmarksCount = 0;

    return dto;
  }
} 
