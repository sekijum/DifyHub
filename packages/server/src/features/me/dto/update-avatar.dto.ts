import { IsOptional, IsString } from "class-validator";

export class UpdateAvatarDto {
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

// 後方互換性のために古い名前も残しておく
export { UpdateAvatarDto as UpdateMyAvatarDto };
