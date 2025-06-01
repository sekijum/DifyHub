import {
  Controller,
  Get,
  Query,
  Param,
  Req,
  Post,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { AppsService, AppWithRatings, AppDetailWithRatings } from "./apps.service";
import { FindAppListQueryDto, FindRecommendedAppListQueryDto } from "./dto";
import { ParseIntPipe } from "@nestjs/common";
import { JwtAuthGuard } from "@/core/auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "@/core/auth/guards/optional-jwt-auth.guard";
import { PaginatedResponse } from "@/core/types/api-response.type";
import { Request } from "express";

/**
 * アプリ関連のエンドポイントを提供するコントローラー
 */
@Controller("apps")
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  /**
   * アプリ一覧を取得
   */
  @Get()
  findAppList(@Query() query: FindAppListQueryDto) {
    return this.appsService.findAppList(query);
  }

  /**
   * アプリ詳細を取得
   */
  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  findAppById(@Param("id", ParseIntPipe) appId: number, @Req() req: Request) {
    const userId = (req.user as any)?.userId;

    if (userId !== undefined && typeof userId !== "number") {
      return this.appsService.findAppById(appId, undefined);
    }

    return this.appsService.findAppById(appId, userId);
  }

  /**
   * おすすめアプリ一覧を取得
   */
  @Get(":id/recommended")
  findRecommendedAppList(
    @Param("id", ParseIntPipe) currentAppId: number,
    @Query() query: FindRecommendedAppListQueryDto,
  ) {
    return this.appsService.findRecommendedAppList(currentAppId, query);
  }

  /**
   * アプリを使用
   */
  @Post(":id/use")
  @UseGuards(JwtAuthGuard)
  useApp(@Param("id", ParseIntPipe) appId: number, @Req() req: Request) {
    const userId = (req.user as any)?.userId;
    if (typeof userId !== "number") {
      throw new UnauthorizedException(
        "有効なユーザー認証情報が見つかりません。",
      );
    }
    return this.appsService.useApp(appId, userId);
  }
}
