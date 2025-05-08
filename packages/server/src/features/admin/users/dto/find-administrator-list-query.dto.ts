import { PaginationDto } from "@/core/dto/index";
import { UserStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class FindAdministratorListQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
