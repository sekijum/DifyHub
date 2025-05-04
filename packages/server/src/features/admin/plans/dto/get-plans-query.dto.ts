import { IsEnum, IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum PlanSortField {
  NAME = 'name',
  PRICE_MONTHLY = 'priceMonthly',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetPlansQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 25;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PlanSortField)
  sortBy?: PlanSortField;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
} 
