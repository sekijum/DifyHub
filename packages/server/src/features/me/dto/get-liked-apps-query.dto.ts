import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';

const ALLOWED_SORT_FIELDS = ['createdAt', 'usageCount'] as const;
type SortField = typeof ALLOWED_SORT_FIELDS[number];

const ALLOWED_SORT_ORDERS = ['asc', 'desc'] as const;
type SortOrder = typeof ALLOWED_SORT_ORDERS[number];

export class GetLikedAppsQueryDto {
  /**
   * ソート対象のフィールド
   * (createdAt: 評価日時, usageCount: 利用回数)
   * @default createdAt
   */
  @IsOptional()
  @IsIn(ALLOWED_SORT_FIELDS)
  sortBy?: SortField = 'createdAt';

  /**
   * ソート順 (asc: 昇順, desc: 降順)
   * @default desc
   */
  @IsOptional()
  @IsIn(ALLOWED_SORT_ORDERS)
  sortOrder?: SortOrder = 'desc';

  /**
   * アプリ名による部分一致フィルタ
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * アプリ説明による部分一致フィルタ
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * 取得するページ番号 (1始まり)
   * @default 1
   */
  @IsOptional()
  @Type(() => Number) // クエリパラメータは文字列で来るため数値に変換
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * 1ページあたりの取得件数
   * @default 10
   * @maximum 100
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // 大量取得を防ぐため上限を設定
  limit?: number = 10;
} 
