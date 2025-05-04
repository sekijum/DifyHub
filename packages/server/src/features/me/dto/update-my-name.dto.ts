import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateMyNameDto {
  @IsString()
  @IsNotEmpty({ message: '名前は必須です' })
  @MaxLength(50, { message: '名前は50文字以内で入力してください' })
  name: string;
} 
