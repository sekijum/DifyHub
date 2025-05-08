import { PaginationDto } from "@/core/dto/index";
import { UserStatus } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export class FindDeveloperListQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
