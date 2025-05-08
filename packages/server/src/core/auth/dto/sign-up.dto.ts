import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  Matches,
  IsUrl,
} from "class-validator";

export class SignUpDto {
  @IsString()
  name: string;

  @IsEmail({}, { message: "有効なメールアドレスを入力してください。" })
  email: string;

  @IsString()
  @MinLength(8, { message: "パスワードは8文字以上である必要があります。" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      "パスワードには大文字、小文字、数字をそれぞれ1文字以上含める必要があります。",
  })
  password: string;

  @IsOptional()
  @IsUrl({}, { message: "アバターURLの形式が正しくありません" })
  avatarUrl?: string;
}
