import { IsOptional, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import { DEFAULT_PAGE, DEFAULT_LIMIT } from "@/core/utils";

export class FindBookmarksInFolderQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = DEFAULT_PAGE;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = DEFAULT_LIMIT;
}
