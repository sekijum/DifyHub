import { IsEnum, IsNotEmpty } from "class-validator";
import { RatingType } from "@prisma/client";

export class RateAppDto {
  // @ApiProperty({ enum: RatingType, description: '評価タイプ (LIKE or DISLIKE)' })
  @IsNotEmpty({ message: "評価タイプは必須です。" })
  @IsEnum(RatingType, {
    message: "評価タイプは LIKE または DISLIKE である必要があります。",
  })
  type: RatingType;
}
