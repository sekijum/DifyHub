import { IsOptional, IsString, IsIn } from "class-validator";
import { PaginationDto } from "@/core/dto/pagination.dto";

/**
 * ユーザーのアプリ一覧取得クエリDTO
 */
export class FindUserAppListQueryDto extends PaginationDto {}
