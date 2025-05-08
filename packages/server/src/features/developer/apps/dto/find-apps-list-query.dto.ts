import {
  IsOptional,
  IsEnum,
  IsInt,
  IsString,
  Min,
  IsIn,
} from "class-validator";
import { Type } from "class-transformer";
import { AppStatus } from "@prisma/client";

export class FindAppsListQueryDto {
  /**
   * ページ番号
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  /**
   * 1ページあたりの件数
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  /**
   * アプリステータスでフィルタリング
   */
  @IsOptional()
  @IsEnum(AppStatus)
  status?: AppStatus;

  /**
   * カテゴリIDでフィルタリング
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  /**
   * 検索キーワード（アプリ名、説明などに含まれる文字列）
   */
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * 並び替えのフィールド
   */
  @IsOptional()
  @IsString()
  @IsIn(["createdAt", "updatedAt", "name", "usageCount"])
  sortBy?: string;

  /**
   * 並び替えの順序
   */
  @IsOptional()
  @IsString()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc";
}
