import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateAdministratorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
