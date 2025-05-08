import { PaginationDto } from '@/core/dto/pagination.dto';
import { PlanStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class FindPlanListQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;
} 
