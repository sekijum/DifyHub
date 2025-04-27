import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateVideoDto {
  @ApiProperty({ example: '動画タイトル' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '動画の詳細な説明文', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 300 })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty({ example: [1, 2, 3], description: 'タグのID配列', required: false })
  @IsInt({ each: true })
  @IsOptional()
  tags?: number[];

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isShort?: boolean;
} 
