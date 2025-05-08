import { IsEnum, IsOptional, IsString } from "class-validator";
import { AppStatus } from "@prisma/client";

export class UpdateAppStatusDto {
  @IsEnum(AppStatus)
  status: AppStatus;

  @IsOptional()
  @IsString()
  resultReason?: string; // ステータス変更理由
}
