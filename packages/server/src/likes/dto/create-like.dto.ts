import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty } from 'class-validator';

export class CreateLikeDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  videoId: number;

  @ApiProperty({ example: true, description: 'true: 高評価, false: 低評価' })
  @IsBoolean()
  @IsNotEmpty()
  isLike: boolean;
} 
