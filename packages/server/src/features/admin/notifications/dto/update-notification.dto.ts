import {
  IsEnum,
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
} from "class-validator";
import { NotificationLevel } from "@prisma/client";

/**
 * お知らせ更新DTO
 */
export class UpdateNotificationDto {
  /**
   * お知らせタイトル
   */
  @IsOptional()
  @IsString()
  title?: string;

  /**
   * お知らせ内容
   */
  @IsOptional()
  @IsString()
  content?: string;

  /**
   * お知らせレベル
   */
  @IsOptional()
  @IsEnum(NotificationLevel)
  level?: NotificationLevel;

  /**
   * 開始日時
   */
  @IsOptional()
  @IsDateString()
  startAt?: string;

  /**
   * 終了日時（空文字列の場合は無期限に変更）
   */
  @IsOptional()
  @IsDateString()
  endAt?: string;

  /**
   * トップに固定表示するかどうか
   */
  @IsOptional()
  @IsBoolean()
  isVisibleOnTop?: boolean;
}
