import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DeveloperRequestStatus } from '@prisma/client';

export class UpdateDeveloperRequestStatusDto {
  @IsEnum(DeveloperRequestStatus)
  status: DeveloperRequestStatus;

  @IsOptional()
  @IsString()
  resultReason?: string; // 申請結果の理由（承認・却下共通）
} 
