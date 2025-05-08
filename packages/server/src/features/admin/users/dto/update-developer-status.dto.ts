import { IsEnum, IsNotEmpty } from "class-validator";
import { UserStatus } from "@prisma/client";

export class UpdateDeveloperStatusDto {
  @IsNotEmpty()
  @IsEnum(UserStatus)
  status: UserStatus;
}
