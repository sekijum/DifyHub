import { IsEnum, IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { NotificationLevel } from '@prisma/client';

export class UpdateNotificationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(NotificationLevel)
  level?: NotificationLevel;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsBoolean()
  isVisibleOnTop?: boolean;
} 
