import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class SubscribeDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  channelId: number;
} 
