import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString, IsIn, IsNumberString, IsArray, ValidateIf } from 'class-validator';

const validSortBy = ['createdAt', 'usageCount', 'name'] as const;
type SortByType = typeof validSortBy[number];

export class GetAppsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // パフォーマンスのため最大取得件数を制限
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @IsIn(validSortBy)
  sortBy?: SortByType = 'createdAt';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @ValidateIf(o => typeof o.categoryId === 'string' || Array.isArray(o.categoryId)) // Allow single string or array
  @Type(() => String) // Ensure input is treated as string(s)
  @IsNumberString({}, { message: 'categoryId must be a number string or an array of number strings' , each: true })
  categoryId?: string | string[];

  @IsOptional()
  @ValidateIf(o => typeof o.tag === 'string' || Array.isArray(o.tag)) // Allow single string or array
  @Type(() => String)
  @IsString({ each: true })
  tag?: string | string[];
} 
