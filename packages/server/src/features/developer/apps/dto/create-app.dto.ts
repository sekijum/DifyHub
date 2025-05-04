import { 
  IsNotEmpty, 
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
import { AppStatus } from '@prisma/client';

export class AppSubImageDto {
  @IsString()
  @IsUrl()
  imageUrl: string;

  @IsInt()
  order: number;
}

export class CreateAppDto {
  /**
   * アプリ名
   */
  @IsNotEmpty()
  @IsString()
  name: string;

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
   * アプリのURL（必須）
   */
  @IsNotEmpty()
  @IsUrl()
  appUrl: string;

  /**
   * カテゴリID（必須）
   */
  @IsNotEmpty()
  @IsInt()
  categoryId: number;

  /**
   * アプリステータス
   */
  @IsNotEmpty()
  @IsEnum(AppStatus)
  status: AppStatus;

  /**
   * サブスクリプション限定かどうか
   */
  @IsOptional()
  @IsBoolean()
  isSubscriptionLimited?: boolean;

  /**
   * タグID配列
   */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];

  /**
   * サブ画像配列
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => AppSubImageDto)
  subImages?: AppSubImageDto[];
} 
