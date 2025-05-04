import { IsEnum, IsOptional, IsString, IsInt, Min, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationLevel } from '@prisma/client';

export class GetNotificationsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(NotificationLevel)
  level?: NotificationLevel;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isVisibleOnTop?: boolean;

  @IsOptional()
  @IsDateString()
  activeAfter?: string;

  @IsOptional()
  @IsDateString()
  activeBefore?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'startAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
} 
