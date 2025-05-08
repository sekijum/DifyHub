import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  IsNotEmpty,
} from "class-validator";

export class CreateDeveloperRequestDto {
  /**
   * 開発者申請時に提出するポートフォリオ等のURL (任意)
   * @example 'https://my-portfolio.example.com'
   */
  @IsOptional()
  @IsString()
  @IsUrl(
    { require_protocol: true },
    { message: "有効なURLを入力してください (例: https://...)" },
  )
  @MaxLength(2048) // URLの最大長を考慮
  portfolioUrl?: string;

  /**
   * 開発者申請の理由 (必須)
   * @example '新しいアプリを開発・公開するため'
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000) // 例: 最大1000文字
  reason: string;
}
