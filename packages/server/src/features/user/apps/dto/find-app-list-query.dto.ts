import {
  IsOptional,
  IsString,
  IsArray,
  IsInt,
  IsNumber,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { PaginationDto } from "@/core/dto/pagination.dto";

/**
 * アプリ一覧取得クエリDTO
 */
export class FindAppListQueryDto extends PaginationDto {
  /**
   * カテゴリIDによるフィルター
   * カンマ区切りの数値文字列または数値の配列
   */
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  categoryId?: number;

  /**
   * タグ名によるフィルター
   * カンマ区切りの文字列または文字列の配列
   */
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  tagId?: number;
}
