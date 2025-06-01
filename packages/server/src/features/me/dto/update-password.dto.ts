import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty({ message: "新しいパスワードは必須です" })
  @MinLength(8, { message: "新しいパスワードは8文字以上である必要があります" })
  newPassword: string;
}

// 後方互換性のために古い名前も残しておく
export { UpdatePasswordDto as UpdateMyPasswordDto };
