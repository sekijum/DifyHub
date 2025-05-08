import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { AdminNotificationsService } from "./admin.notifications.service";
import {
  FindNotificationListQueryDto,
  CreateNotificationDto,
  UpdateNotificationDto,
} from "./dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
@Controller("admin/notifications")
export class AdminNotificationsController {
  constructor(
    private readonly adminNotificationsService: AdminNotificationsService,
  ) {}

  /**
   * お知らせ一覧を取得
   */
  @Get()
  findNotificationList(@Query() query: FindNotificationListQueryDto) {
    return this.adminNotificationsService.findNotificationList(query);
  }

  /**
   * お知らせ詳細を取得
   */
  @Get(":id")
  findNotificationById(@Param("id", ParseIntPipe) id: number) {
    return this.adminNotificationsService.findNotificationById(id);
  }

  /**
   * お知らせを作成
   */
  @Post()
  create(@Body() createDto: CreateNotificationDto) {
    return this.adminNotificationsService.createNotification(createDto);
  }

  /**
   * お知らせを更新
   */
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateNotificationDto,
  ) {
    return this.adminNotificationsService.updateNotification(id, updateDto);
  }

  /**
   * お知らせを削除
   */
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.adminNotificationsService.deleteNotification(id);
  }
}
