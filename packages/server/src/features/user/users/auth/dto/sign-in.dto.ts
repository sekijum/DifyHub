import { IsEmail, IsString, IsNotEmpty } from "class-validator";

/**
 * ユーザーサインインDTO
 */
export class SignInDto {
  /**
   * メールアドレス
   */
  @IsEmail({}, { message: "有効なメールアドレスを入力してください。" })
  email: string;

  /**
   * パスワード
   */
  @IsString()
  @IsNotEmpty({ message: "パスワードを入力してください。" })
  password: string;
}
