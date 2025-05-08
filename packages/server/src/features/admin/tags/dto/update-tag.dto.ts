import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateTagDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  name: string;
}
