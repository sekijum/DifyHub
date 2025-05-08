import { IsNotEmpty, IsString } from "class-validator";

export class UpdatePlanDto {
  @IsString()
  @IsNotEmpty({ message: "プラン名は必須です" })
  planName: string;
}

// 後方互換性のために古い名前も残しておく
export { UpdatePlanDto as UpdateMyPlanDto };
