import { IsOptional, IsInt, IsArray } from "class-validator";
import { Type, Transform } from "class-transformer";
import { PaginationDto } from "@/core/dto/pagination.dto";

/**
 * 推奨アプリ一覧取得クエリDTO
 */
export class FindRecommendedAppListQueryDto extends PaginationDto {
  /**
   * カテゴリIDによるフィルター
   */
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  categoryId?: number;

  /**
   * タグIDによるフィルター（配列）
   */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Transform(({ value }) => {
    if (!value) return [];
    const arr = Array.isArray(value) ? value : [value];
    return arr.map(v => Number(v));
  })
  tagIds?: number[];
}
