import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsBoolean,
  IsInt,
  IsArray,
  IsEnum,
  IsIn,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { PlanStatus } from "@prisma/client";

/**
 * プラン作成DTO
 *
 * 注意: 一部フィールドは実際のDBでは features JSON フィールドに格納されます
 */
export class CreatePlanDto {
  /**
   * プラン名（一意の識別子としても使用）
   */
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * 月額料金（単位：円）
   * DB上は priceMonthly フィールドに保存されます
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(50)
  @Max(30000)
  @Type(() => Number)
  amount: number;

  /**
   * 課金周期
   */
  @IsOptional()
  @IsString()
  @IsIn(["month", "year"], {
    message: "課金周期はMONTHLYまたはANNUALのみ対応しています",
  })
  billingPeriod?: "month" | "year" = "month";

  /**
   * ステータス
   * DB上は status フィールドに保存されます
   */
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus = PlanStatus.ACTIVE;

  /**
   * 追加機能リスト
   * features JSON の additionalFeatures フィールドに保存されます
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
