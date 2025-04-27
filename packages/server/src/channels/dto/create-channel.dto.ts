import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChannelDto {
  @ApiProperty({ example: 'マイチャンネル' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ここではプログラミングの動画を投稿しています。', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://example.com/banner.jpg', required: false })
  @IsString()
  @IsOptional()
  banner?: string;
} 
