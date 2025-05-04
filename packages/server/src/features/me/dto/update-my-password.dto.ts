import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class UpdateMyPasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: '新しいパスワードは8文字以上である必要があります' })
  // Example regex: At least one uppercase, one lowercase, one number, one special character
  // @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:"<>?~`\-=\[\]\\;',.\/]).{8,}$/, {
  //   message: 'パスワードは、大文字、小文字、数字、特殊文字をそれぞれ1文字以上含む必要があります',
  // })
  newPassword: string;
} 
