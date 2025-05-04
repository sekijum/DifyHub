import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMyPlanDto {
  @IsString()
  @IsNotEmpty({ message: 'プラン名は必須です' })
  planName: string; // prisma.schema の Plan.name に対応
} 
