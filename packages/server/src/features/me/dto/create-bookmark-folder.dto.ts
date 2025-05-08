import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateBookmarkFolderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50) // フォルダ名の最大長を50文字に設定
  name: string;
}
