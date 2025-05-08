import { IsEnum, IsOptional } from "class-validator";
import { DeveloperRequestStatus } from "@prisma/client";
import { PaginationDto } from "@/core/dto/index";

export class FindDeveloperRequestListQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(DeveloperRequestStatus)
  status?: DeveloperRequestStatus;
}
