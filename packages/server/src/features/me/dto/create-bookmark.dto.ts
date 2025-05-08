import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class CreateBookmarkDto {
  /**
   * ブックマークするアプリのID
   * @example 1
   */
  @IsInt()
  appId: number;

  /**
   * ブックマークを追加するフォルダのID (folderName とどちらか一方を指定)
   * @example 1
   */
  @IsOptional()
  @IsInt()
  @ValidateIf((o) => o.folderName === undefined || o.folderName === null)
  folderId?: number;

  /**
   * ブックマークを追加するフォルダの名前 (folderId とどちらか一方を指定)
   * 既存フォルダが見つからない場合は新規作成されます。
   * @example '後で見る'
   */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ValidateIf((o) => o.folderId === undefined || o.folderId === null)
  folderName?: string;
}
