import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Query,
  Body,
  Param,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { AdminAppsService } from './admin.apps.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/auth/guards/roles.guard';
import { Roles } from '@/core/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetAppsQueryDto } from './dto/get-apps-query.dto';
import { UpdateAppStatusDto } from './dto/update-app-status.dto';
import { AppWithCreator, PaginatedAppsResult } from './admin.apps.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
@Controller('admin/apps')
export class AdminAppsController {
  constructor(private readonly adminAppsService: AdminAppsService) {}

  /**
   * アプリ一覧を取得
   */
  @Get()
  async getApps(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: GetAppsQueryDto,
  ): Promise<PaginatedAppsResult> {
    return this.adminAppsService.findApps(query);
  }

  /**
   * アプリ詳細を取得
   */
  @Get(':id')
  async getAppById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AppWithCreator> {
    return this.adminAppsService.findAppById(id);
  }

  /**
   * アプリのステータスを更新
   */
  @Patch(':id/status')
  async updateAppStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateDto: UpdateAppStatusDto,
  ): Promise<AppWithCreator> {
    return this.adminAppsService.updateAppStatus(id, updateDto);
  }
} 
