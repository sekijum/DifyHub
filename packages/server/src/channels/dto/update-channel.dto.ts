import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateChannelDto {
  @ApiProperty({ example: '新しいチャンネル名', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '更新した説明文です。', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://example.com/new-banner.jpg', required: false })
  @IsString()
  @IsOptional()
  banner?: string;
} 
