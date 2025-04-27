import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ example: '編集後のコメント内容です' })
  @IsString()
  @IsOptional()
  text?: string;
} 
