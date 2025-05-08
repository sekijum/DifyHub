import { IsOptional, IsInt, IsArray } from "class-validator";
import { Type } from "class-transformer";
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
  tagIds?: number[];
}
