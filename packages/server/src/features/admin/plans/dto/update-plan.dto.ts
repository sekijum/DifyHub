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
   * 月額料金（単位：円）
   * DB上は priceMonthly フィールドに保存されます
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount?: number;

  /**
   * Square連携用カタログID
   */
  @IsOptional()
  @IsString()
  squareId?: string;

  /**
   * 通貨コード
   */
  @IsOptional()
  @IsString()
  @IsIn(["JPY", "USD"], {
    message: "通貨コードはJPYまたはUSDのみ対応しています",
  })
  squareCurrency?: string;

  /**
   * 課金周期
   */
  @IsOptional()
  @IsString()
  @IsIn(["MONTHLY", "ANNUAL"], {
    message: "課金周期はMONTHLYまたはANNUALのみ対応しています",
  })
  billingPeriod?: string;

  /**
   * 最大アプリ作成数
   * features JSON に保存されます
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  maxApps?: number;

  /**
   * 最大API呼び出し数
   * features JSON に保存されます
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  maxApiCalls?: number;

  /**
   * 最大ストレージ容量（MB）
   * features JSON に保存されます
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  maxStorage?: number;

  /**
   * 公開プランかどうか
   * features JSON に保存されます
   */
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

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
