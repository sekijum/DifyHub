import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Query,
  Body,
  Param,
  ParseIntPipe,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "@/core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "@/core/auth/guards/roles.guard";
import { Roles } from "@/core/auth/decorators/roles.decorator";
import { AdminAppsService } from "./admin.apps.service";
import { FindAppListQueryDto, UpdateAppStatusDto } from "./dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
@Controller("admin/apps")
export class AdminAppsController {
  constructor(private readonly adminAppsService: AdminAppsService) {}

  /**
   * アプリ一覧を取得
   */
  @Get()
  findAppList(@Query() query: FindAppListQueryDto) {
    return this.adminAppsService.findAppList(query);
  }

  /**
   * アプリ詳細を取得
   */
  @Get(":id")
  findAppById(@Param("id", ParseIntPipe) id: number) {
    return this.adminAppsService.findAppById(id);
  }

  /**
   * アプリのステータスを更新
   */
  @Patch(":id/status")
  updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateAppStatusDto,
  ) {
    return this.adminAppsService.updateAppStatus(id, updateDto);
  }
}
