import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateAdministratorDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
