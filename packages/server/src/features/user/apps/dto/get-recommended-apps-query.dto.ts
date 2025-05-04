import { IsOptional, IsInt, IsArray, Min, Max, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class GetRecommendedAppsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100) // Limit max items per page
  @Type(() => Number)
  limit: number = 10;

  // ★ Change from array to single number
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  categoryId?: number;

  // Keep tagIds as array for now, unless specified otherwise
  @IsOptional()
  @IsArray()
  tagIds?: number[];
} 
