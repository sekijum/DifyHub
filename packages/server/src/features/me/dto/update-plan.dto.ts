import { IsNotEmpty, IsString, IsOptional, ValidateIf } from "class-validator";

export class UpdatePlanDto {
  @IsString()
  @IsNotEmpty({ message: "プラン名は必須です" })
  planName: string;

  @IsString()
  @IsOptional()
  cardToken?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: 'card' | 'apple_pay';
} 
