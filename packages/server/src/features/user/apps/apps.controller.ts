import { Controller, Get, Query, ValidationPipe, Param, Req, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AppsService } from './apps.service';
import { GetAppsQueryDto } from './dto/get-apps-query.dto';
import { GetRecommendedAppsQueryDto } from './dto/get-recommended-apps-query.dto';
import { AppListResponseDto } from './dto/app-list-response.dto';
import { AppDetailDto } from './dto/app-detail.dto';
import { ParseIntPipe, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@/core/auth/guards/optional-jwt-auth.guard';
import { Request } from 'express';

@Controller('apps')
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @Get()
  findAll(
    @Query(new ValidationPipe({ 
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })) 
    query: GetAppsQueryDto,
  ): Promise<AppListResponseDto> {
    return this.appsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('id', ParseIntPipe) appId: number,
    @Req() req: Request,
  ): Promise<AppDetailDto> {
    const userId = (req.user as any)?.userId;

    console.debug(`[AppsController] findOne - appId: ${appId}, req.user found: ${!!req.user}, userId extracted: ${userId}`);

    if (userId !== undefined && typeof userId !== 'number') {
      console.warn(`[AppsController] findOne: Received invalid userId type from req.user. userId: ${userId}, type: ${typeof userId}. Treating as undefined.`);
      return this.appsService.findOne(appId, undefined);
    }

    return this.appsService.findOne(appId, userId);
  }

  @Get(':id/recommended')
  findRecommended(
    @Param('id', ParseIntPipe) currentAppId: number,
    @Query(new ValidationPipe({ 
      transform: true,
      whitelist: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })) 
    query: GetRecommendedAppsQueryDto,
  ): Promise<AppListResponseDto> {
    console.debug(`[AppsController] findRecommended - currentAppId: ${currentAppId}, query:`, query);
    return this.appsService.findRecommended(currentAppId, query);
  }

  @Post(':id/use')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async useApp(
    @Param('id', ParseIntPipe) appId: number,
    @Req() req: Request,
  ): Promise<void> {
    const userId = (req.user as any)?.userId;
    if (typeof userId !== 'number') {
      console.error('[AppsController] useApp: Valid userId not found in req.user despite JwtAuthGuard.', req.user);
      throw new UnauthorizedException('有効なユーザー認証情報が見つかりません。');
    }
    await this.appsService.useApp(appId, userId);
  }

  // Add other endpoints like GET /apps/:id later if needed
} 
