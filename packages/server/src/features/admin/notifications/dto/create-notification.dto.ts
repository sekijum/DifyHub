import { IsEnum, IsNotEmpty, IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { NotificationLevel } from '@prisma/client';

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsEnum(NotificationLevel)
  @IsOptional()
  level?: NotificationLevel = NotificationLevel.INFO;

  @IsNotEmpty()
  @IsDateString()
  startAt: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsBoolean()
  isVisibleOnTop?: boolean = false;
} 
