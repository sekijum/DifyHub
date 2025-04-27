import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'これは素晴らしい動画ですね！' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  videoId: number;
} 
