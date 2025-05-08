import { IsEmail, IsOptional, IsString } from "class-validator";

export class UserQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
