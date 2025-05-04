import { IsOptional, IsString, IsEnum, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { UserStatus } from '@prisma/client';

// ソート可能なフィールドを定義 (id と createdAt を含める)
const allowedSortByFields = ['id', 'createdAt', 'name', 'email', 'status', 'planName'];

export class GetUsersQueryDto {
  @IsOptional()
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  @Type(() => Number) // Transform query param string to number
  page?: number = 1;

  @IsOptional()
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Type(() => Number) // Transform query param string to number
  limit?: number = 10;

  @IsOptional()
  @IsEnum(UserStatus, { message: `status must be one of the following values: ${Object.values(UserStatus).join(', ')}`})
  status?: UserStatus;

  @IsOptional()
  @IsString()
  search?: string;

  // --- sortBy と sortOrder を追加 ---
  @IsOptional()
  @IsString()
  @IsIn(allowedSortByFields, { message: `sortBy must be one of the following values: ${allowedSortByFields.join(', ')}`})
  sortBy?: string = 'createdAt'; // デフォルトは createdAt

  @IsOptional()
  @IsString() // IsIn は文字列に対して機能するため
  @IsIn(['asc', 'desc'], { message: 'sortOrder must be either asc or desc' })
  sortOrder?: 'asc' | 'desc' = 'desc'; // デフォルトは desc
} 
