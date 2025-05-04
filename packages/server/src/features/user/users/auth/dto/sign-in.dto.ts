import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class SignInDto {
  @IsEmail({}, { message: '有効なメールアドレスを入力してください。' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'パスワードを入力してください。' })
  password: string;
} 
