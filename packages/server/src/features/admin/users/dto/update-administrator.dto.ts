import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAdministratorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string; // パスワード変更は任意
} 
