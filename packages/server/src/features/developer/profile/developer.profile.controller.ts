import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Body,
  ValidationPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "@/core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "@/core/auth/guards/roles.guard";
import { Roles } from "@/core/auth/decorators/roles.decorator";
import { Role } from "@prisma/client";
import { CurrentUser } from "@/core/auth/decorators/current-user.decorator";
import { UserPayload } from "@/core/auth/types/user-payload.interface";
import { DeveloperProfileService } from "./developer.profile.service";
import { UpdateProfileDto } from "./dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DEVELOPER)
@Controller("developer")
export class DeveloperProfileController {
  constructor(
    private readonly developerProfileService: DeveloperProfileService,
  ) {}

  /**
   * 開発者プロフィールを取得
   */
  @Get("profile")
  async findById(@CurrentUser() user: UserPayload) {
    return this.developerProfileService.findById(user.userId);
  }

  /**
   * 開発者ダッシュボード統計情報を取得
   */
  @Get("dashboard-stats")
  async getDashboardStats(@CurrentUser() user: UserPayload) {
    return this.developerProfileService.getDashboardStats(user.userId);
  }

  /**
   * 開発者プロフィールを更新
   */
  @Patch("profile")
  async update(
    @CurrentUser() user: UserPayload,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.developerProfileService.update(user.userId, updateProfileDto);
  }
}
