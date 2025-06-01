import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsBoolean,
  IsInt,
  IsArray,
  IsEnum,
  IsIn,
} from "class-validator";
import { Type } from "class-transformer";
import { PlanStatus } from "@prisma/client";

/**
 * プラン更新DTO
 *
 * 注意: 一部フィールドは実際のDBでは features JSON フィールドに格納されます
 * すべてのフィールドはオプションとなっており、指定されたフィールドのみが更新されます
 */
export class UpdatePlanDto {
  /**
   * プラン名（一意の識別子としても使用）
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * ステータス
   * DB上は status フィールドに保存されます
   */
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  /**
   * 追加機能リスト
   * features JSON の additionalFeatures フィールドに保存されます
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
