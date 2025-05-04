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
  BadRequestException,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { DeveloperAppsService } from './developer.apps.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/auth/guards/roles.guard';
import { Roles } from '@/core/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetAppsQueryDto } from './dto/get-apps-query.dto';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { CurrentUser } from '@/core/auth/decorators/current-user.decorator';
import { UserPayload } from '@/core/auth/types/user-payload.interface';
import { AppWithDetails, PaginatedAppsResult } from './developer.apps.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DEVELOPER)
@Controller('developer/apps')
export class DeveloperAppsController {
  constructor(private readonly developerAppsService: DeveloperAppsService) {}

  /**
   * アプリ一覧を取得
   */
  @Get()
  async getApps(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: GetAppsQueryDto,
    @CurrentUser() user: UserPayload,
  ): Promise<PaginatedAppsResult> {
    return this.developerAppsService.findApps(query, user.userId);
  }

  /**
   * アプリ詳細を取得
   */
  @Get(':id')
  async getAppById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserPayload,
  ): Promise<AppWithDetails> {
    return this.developerAppsService.findAppById(id, user.userId);
  }

  /**
   * アプリを新規作成
   */
  @Post()
  async createApp(
    @Body(ValidationPipe) createDto: CreateAppDto,
    @CurrentUser() user: UserPayload,
  ): Promise<AppWithDetails> {
    return this.developerAppsService.createApp(createDto, user.userId);
  }

  /**
   * アプリを更新
   */
  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'newSubImages', maxCount: 5 },
  ]))
  async updateApp(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: UserPayload,
    @UploadedFiles() files: { thumbnail?: Express.Multer.File[], newSubImages?: Express.Multer.File[] },
  ): Promise<AppWithDetails> {
    console.log('受信データ:', body);
    console.log('受信ファイル:', files);
    
    if (!body) {
      throw new BadRequestException('リクエストボディが空です');
    }
    
    let updateDto: UpdateAppDto;
    
    // JSONデータがdata属性に格納されている場合の処理
    if (body.data && typeof body.data === 'string') {
      try {
        const jsonData = JSON.parse(body.data);
        console.log('パースしたJSONデータ:', jsonData);
        updateDto = jsonData;
      } catch (error) {
        console.error('JSONパースエラー:', error);
        throw new BadRequestException('JSONデータの解析に失敗しました');
      }
    } else {
      updateDto = body;
    }
    
    console.log('処理するデータ:', updateDto);
    return this.developerAppsService.updateApp(id, updateDto, user.userId, files);
  }

  /**
   * アプリを削除
   */
  @Delete(':id')
  async deleteApp(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserPayload,
  ): Promise<{ message: string }> {
    await this.developerAppsService.deleteApp(id, user.userId);
    return { message: 'アプリを削除しました' };
  }
} 
