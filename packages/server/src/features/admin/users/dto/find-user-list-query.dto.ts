import { PaginationDto } from "@/core/dto/pagination.dto";
import { UserStatus } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export class FindUserListQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
