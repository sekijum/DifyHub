import { 
  IsString, 
  IsOptional, 
  IsUrl, 
  IsArray, 
  IsInt,
  IsBoolean,
  ArrayMaxSize,
  ValidateNested,
  IsEnum
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppSubImageDto } from './create-app.dto';
import { AppStatus } from '@prisma/client';

export class UpdateAppDto {
  /**
   * アプリ名
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * アプリの説明
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * サムネイル画像URL
   */
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  /**
   * サムネイルを削除するかどうか
   */
  @IsOptional()
  @IsBoolean()
  removeThumbnail?: boolean;

  /**
   * アプリのURL
   */
  @IsOptional()
  @IsUrl()
  appUrl?: string;

  /**
   * カテゴリID
   */
  @IsOptional()
  @IsInt()
  categoryId?: number;

  /**
   * アプリステータス
   */
  @IsOptional()
  @IsEnum(AppStatus)
  status?: AppStatus;

  /**
   * サブスクリプション限定かどうか（フロントエンド側のフィールド名に合わせる）
   */
  @IsOptional()
  @IsBoolean()
  isSubscriptionOnly?: boolean;

  /**
   * 従来型のサブスクリプション限定フィールド（後方互換性のため）
   */
  @IsOptional()
  @IsBoolean()
  isSubscriptionLimited?: boolean;

  /**
   * タグID配列（従来型）
   */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];

  /**
   * タグ名配列（新形式）
   */
  @IsOptional()
  @IsArray()
  tags?: string[];

  /**
   * 既存のサブ画像ID配列（順序維持用）
   */
  @IsOptional()
  @IsArray()
  existingSubImageIds?: string[];

  /**
   * サブ画像配列（更新時は完全上書き）
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => AppSubImageDto)
  subImages?: AppSubImageDto[];
} 
