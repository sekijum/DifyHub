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
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminNotificationsService } from './admin.notifications.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/auth/guards/roles.guard';
import { Roles } from '@/core/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PaginatedNotificationsResult } from './admin.notifications.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly adminNotificationsService: AdminNotificationsService) {}

  /**
   * お知らせ一覧を取得
   */
  @Get()
  async getNotifications(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: GetNotificationsQueryDto,
  ): Promise<PaginatedNotificationsResult> {
    return this.adminNotificationsService.findNotifications(query);
  }

  /**
   * お知らせ詳細を取得
   */
  @Get(':id')
  async getNotificationById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminNotificationsService.findNotificationById(id);
  }

  /**
   * お知らせを作成
   */
  @Post()
  async createNotification(
    @Body(ValidationPipe) createDto: CreateNotificationDto,
  ) {
    return this.adminNotificationsService.createNotification(createDto);
  }

  /**
   * お知らせを更新
   */
  @Patch(':id')
  async updateNotification(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateDto: UpdateNotificationDto,
  ) {
    return this.adminNotificationsService.updateNotification(id, updateDto);
  }

  /**
   * お知らせを削除
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.adminNotificationsService.deleteNotification(id);
  }
} 
