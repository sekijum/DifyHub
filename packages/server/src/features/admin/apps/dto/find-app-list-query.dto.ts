import { IsEnum, IsInt, IsOptional } from "class-validator";
import { Type } from "class-transformer";
import { AppStatus } from "@prisma/client";
import { PaginationDto } from "@/core/dto/pagination.dto";

/**
 * アプリ一覧取得クエリDTO
 */
export class FindAppListQueryDto extends PaginationDto {
  /**
   * ステータスによるフィルター
   */
  @IsOptional()
  @IsEnum(AppStatus)
  status?: AppStatus;

  /**
   * カテゴリIDによるフィルター
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;
}
