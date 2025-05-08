import { IsOptional, IsString } from "class-validator";
import { PaginationDto } from "@/core/dto/pagination.dto";

/**
 * お気に入りアプリ一覧取得クエリDTO
 */
export class FindLikedAppListQueryDto extends PaginationDto {
  /**
   * ソート項目
   */
  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  /**
   * ソート順序
   */
  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc" = "desc";
}
