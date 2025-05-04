import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class FindUserAppsQueryDto {
  @IsOptional()
  @Type(() => Number) // 文字列で来る可能性があるので数値に変換
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // 一度に取得する最大件数を制限
  limit?: number;

  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'usageCount', 'name']) // 許可するソートキー
  sortBy?: 'createdAt' | 'usageCount' | 'name';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc']) // 許可するソート順
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  appName?: string;
} 
