import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/auth/guards/roles.guard';
import { Roles } from '@/core/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '@/core/auth/decorators/current-user.decorator';
import { UserPayload } from '@/core/auth/types/user-payload.interface';
import { DeveloperProfileService, DeveloperProfile } from './developer.profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DEVELOPER)
@Controller('developer/profile')
export class DeveloperProfileController {
  constructor(private readonly developerProfileService: DeveloperProfileService) {}

  /**
   * 開発者プロフィールを取得
   */
  @Get()
  async getProfile(@CurrentUser() user: UserPayload): Promise<DeveloperProfile> {
    return this.developerProfileService.getProfile(user.userId);
  }

  /**
   * 開発者プロフィールを更新
   */
  @Patch()
  async updateProfile(
    @CurrentUser() user: UserPayload,
    @Body() updateProfileDto: UpdateProfileDto
  ): Promise<DeveloperProfile> {
    console.log('プロフィール更新リクエスト:', updateProfileDto);
    
    return this.developerProfileService.updateProfile(
      user.userId,
      updateProfileDto
    );
  }
} 
