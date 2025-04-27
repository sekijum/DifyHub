import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'new_username', required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ example: 'newpassword123', required: false })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @ApiProperty({ example: 'https://example.com/new-avatar.jpg', required: false })
  @IsString()
  @IsOptional()
  avatar?: string;
} 
