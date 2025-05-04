import { 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  IsOptional, 
  Min, 
  IsBoolean, 
  IsInt, 
  IsArray,
  IsEnum
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlanStatus } from '@prisma/client';

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
  @Min(0)
  @Type(() => Number)
  price: number;

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
  isPublic?: boolean = true;

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
