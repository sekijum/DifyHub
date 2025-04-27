import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateVideoDto {
  @ApiProperty({ example: '更新後の動画タイトル', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: '更新後の動画の詳細な説明文', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: [1, 2, 3], description: '更新後のタグのID配列', required: false })
  @IsInt({ each: true })
  @IsOptional()
  tags?: number[];

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isShort?: boolean;
} 
