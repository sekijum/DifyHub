import { IsOptional, IsString, IsEnum, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { UserStatus } from '@prisma/client';

// ソート可能なフィールドを定義
const allowedSortByFields = ['id', 'createdAt', 'name', 'email', 'status', 'developerName'];

export class GetDevelopersQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  search?: string;

  // ソートに関するプロパティを追加
  @IsOptional()
  @IsString()
  @IsIn(allowedSortByFields, { message: `sortBy must be one of the following values: ${allowedSortByFields.join(', ')}`})
  sortBy?: string = 'createdAt'; // デフォルトは createdAt

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'], { message: 'sortOrder must be either asc or desc' })
  sortOrder?: 'asc' | 'desc' = 'desc'; // デフォルトは desc
} 
