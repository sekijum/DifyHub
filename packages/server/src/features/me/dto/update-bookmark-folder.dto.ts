import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateBookmarkFolderDto {
  /**
   * 更新後のブックマークフォルダの名前
   * @example 'お気に入り(更新)'
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;
}
