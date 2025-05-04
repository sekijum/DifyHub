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
import { AdminDeveloperRequestsService } from './admin.developer-requests.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/auth/guards/roles.guard';
import { Roles } from '@/core/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetDeveloperRequestsQueryDto } from './dto/get-developer-requests-query.dto';
import { UpdateDeveloperRequestStatusDto } from './dto/update-developer-request-status.dto';
import { DeveloperRequestWithUser, PaginatedDeveloperRequestsResult } from './admin.developer-requests.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
@Controller('admin/developer-requests')
export class AdminDeveloperRequestsController {
  constructor(private readonly adminDeveloperRequestsService: AdminDeveloperRequestsService) {}

  /**
   * 開発者申請一覧を取得
   */
  @Get()
  async getDeveloperRequests(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: GetDeveloperRequestsQueryDto,
  ): Promise<PaginatedDeveloperRequestsResult> {
    return this.adminDeveloperRequestsService.findDeveloperRequests(query);
  }

  /**
   * 開発者申請詳細を取得
   */
  @Get(':id')
  async getDeveloperRequestById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeveloperRequestWithUser> {
    return this.adminDeveloperRequestsService.findDeveloperRequestById(id);
  }

  /**
   * 開発者申請のステータスを更新（承認・却下）
   */
  @Patch(':id/status')
  async updateDeveloperRequestStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateDto: UpdateDeveloperRequestStatusDto,
  ): Promise<DeveloperRequestWithUser> {
    return this.adminDeveloperRequestsService.updateDeveloperRequestStatus(id, updateDto);
  }
} 
