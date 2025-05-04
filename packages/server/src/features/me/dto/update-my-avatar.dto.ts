import { IsNotEmpty, IsUrl } from 'class-validator';

export class UpdateMyAvatarDto {
  @IsUrl({}, { message: '有効なURLを入力してください' })
  @IsNotEmpty({ message: 'アバターURLは必須です' })
  avatarUrl: string;
} 
