import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
} from "class-validator";
import { NotificationLevel } from "@prisma/client";

/**
 * お知らせ作成DTO
 */
export class CreateNotificationDto {
  /**
   * お知らせタイトル
   */
  @IsNotEmpty()
  @IsString()
  title: string;

  /**
   * お知らせ内容
   */
  @IsNotEmpty()
  @IsString()
  content: string;

  /**
   * お知らせレベル
   */
  @IsEnum(NotificationLevel)
  @IsOptional()
  level?: NotificationLevel = NotificationLevel.INFO;

  /**
   * 開始日時
   */
  @IsNotEmpty()
  @IsDateString()
  startAt: string;

  /**
   * 終了日時（指定なしの場合は無期限）
   */
  @IsOptional()
  @IsDateString()
  endAt?: string;

  /**
   * トップに固定表示するかどうか
   */
  @IsOptional()
  @IsBoolean()
  isVisibleOnTop?: boolean = false;
}
