import { 
  IsBoolean, 
  IsNumber, 
  IsOptional,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 設定更新DTO
 * すべてのフィールドはオプションとなっており、指定されたフィールドのみが更新されます
 */
export class UpdateSettingDto {
  /**
   * メンテナンスモード
   */
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  /**
   * 手数料率（小数 例: 0.15 = 15%）
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  commissionRate?: number;

  /**
   * 出金手数料（円）
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  payoutFee?: number;
} 
