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
  Logger,
} from "@nestjs/common";
import { DeveloperAppsService } from "./developer.apps.service";
import { JwtAuthGuard } from "@/core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "@/core/auth/guards/roles.guard";
import { Roles } from "@/core/auth/decorators/roles.decorator";
import { Role } from "@prisma/client";
import { FindAppsListQueryDto } from "./dto/find-apps-list-query.dto";
import { CreateAppDto } from "./dto";
import { UpdateAppDto } from "./dto";
import { CurrentUser } from "@/core/auth/decorators/current-user.decorator";
import { UserPayload } from "@/core/auth/types/user-payload.interface";
import { AppWithDetails } from "./developer.apps.service";
import { FileFieldsInterceptor } from "@nestjs/platform-express";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DEVELOPER)
@Controller("developer/apps")
export class DeveloperAppsController {
  private readonly logger = new Logger(DeveloperAppsController.name);

  constructor(private readonly developerAppsService: DeveloperAppsService) {}

  /**
   * アプリ一覧を取得
   */
  @Get()
  async findAppsList(
    @Query() query: FindAppsListQueryDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.developerAppsService.findAppsList(query, user.userId);
  }

  /**
   * アプリ詳細を取得
   */
  @Get(":id")
  async findAppById(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: UserPayload,
  ) {
    return this.developerAppsService.findAppById(id, user.userId);
  }

  /**
   * アプリを新規作成
   */
  @Post()
  async createApp(
    @Body() createDto: CreateAppDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.developerAppsService.createApp(createDto, user.userId);
  }

  /**
   * アプリを更新
   */
  @Patch(":id")
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "thumbnail", maxCount: 1 },
      { name: "newSubImages", maxCount: 5 },
    ]),
  )
  async updateApp(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: UserPayload,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      newSubImages?: Express.Multer.File[];
    },
  ) {
    try {
      this.logger.log(`アプリ更新リクエスト受信 ID: ${id}`);

      if (!body) {
        throw new BadRequestException("リクエストボディが空です");
      }

      let updateDto: UpdateAppDto;

      // JSONデータがdata属性に格納されている場合の処理
      if (body.data && typeof body.data === "string") {
        try {
          const jsonData = JSON.parse(body.data);
          this.logger.debug("パースしたJSONデータ:", jsonData);
          updateDto = jsonData;
        } catch (error) {
          this.logger.error("JSONパースエラー:", error);
          throw new BadRequestException("JSONデータの解析に失敗しました");
        }
      } else {
        updateDto = body;
      }

      return this.developerAppsService.updateApp(
        id,
        updateDto,
        user.userId,
        files,
      );
    } catch (error) {
      this.logger.error(`アプリ更新エラー: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * アプリを削除
   */
  @Delete(":id")
  async deleteApp(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: UserPayload,
  ) {
    await this.developerAppsService.deleteApp(id, user.userId);
    return { message: "アプリを削除しました" };
  }

  /**
   * アプリの統計情報を取得
   */
  @Get(":id/statistics")
  async findAppStatistics(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: UserPayload,
  ) {
    return this.developerAppsService.findAppStatistics(id, user.userId);
  }
}
