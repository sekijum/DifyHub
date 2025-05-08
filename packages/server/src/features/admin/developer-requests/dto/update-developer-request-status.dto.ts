import { IsEnum, IsOptional, IsString } from "class-validator";
import { DeveloperRequestStatus } from "@prisma/client";

/**
 * 開発者申請ステータス更新DTO
 */
export class UpdateDeveloperRequestStatusDto {
  /**
   * 申請ステータス（承認・却下）
   */
  @IsEnum(DeveloperRequestStatus)
  status: DeveloperRequestStatus;

  /**
   * 申請結果の理由（承認・却下共通）
   */
  @IsOptional()
  @IsString()
  resultReason?: string;
}
