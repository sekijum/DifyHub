import {
  IsString,
  IsOptional,
  IsUrl,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateProfileDto {
  /**
   * 開発者名
   */
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "開発者名は2文字以上入力してください" })
  @MaxLength(50, { message: "開発者名は50文字以内で入力してください" })
  name?: string;

  /**
   * 開発者表示名 (サイト上での表示用)
   */
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "開発者表示名は100文字以内で入力してください" })
  developerName?: string;

  /**
   * 自己紹介
   */
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: "自己紹介は1000文字以内で入力してください" })
  bio?: string;

  /**
   * アバターURL（ファイルアップロード後のURL）
   */
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  /**
   * アバター削除フラグ
   */
  @IsOptional()
  removeAvatar?: boolean;
}
