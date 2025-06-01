import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  Put,
  HttpCode,
  HttpStatus,
  Query,
  ValidationPipe,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  Req,
} from "@nestjs/common";
import { JwtAuthGuard } from "@/core/auth/guards/jwt-auth.guard";
import { MeService } from "./me.service";
import {
  CreateBookmarkDto,
  CreateBookmarkFolderDto,
  CreateDeveloperRequestDto,
  FindBookmarksInFolderQueryDto,
  FindLikedAppListQueryDto,
  RateAppDto,
  UpdateAvatarDto,
  UpdateBookmarkFolderDto,
  UpdateNameDto,
  UpdatePasswordDto,
  UpdatePlanDto,
} from "./dto";
import { CurrentUser } from "@/core/auth/decorators/current-user.decorator";
import { UserPayload } from "@/core/auth/types/user-payload.interface";

/**
 * ユーザー自身の情報を管理するエンドポイントを提供するコントローラー
 */
@UseGuards(JwtAuthGuard)
@Controller("me")
export class MeController {
  constructor(private readonly meService: MeService) {}

  /**
   * プロフィール情報を取得
   */
  @Get("profile")
  findMyProfile(@CurrentUser() user: UserPayload) {
    return this.meService.findMyProfile(user.userId);
  }

  /**
   * 名前を更新
   */
  @Patch("name")
  updateMyName(
    @CurrentUser() user: UserPayload,
    @Body() updateNameDto: UpdateNameDto,
  ) {
    return this.meService.updateMyName(user.userId, updateNameDto);
  }

  /**
   * パスワードを更新
   */
  @Patch("password")
  updateMyPassword(
    @CurrentUser() user: UserPayload,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.meService.updateMyPassword(user.userId, updatePasswordDto);
  }

  /**
   * アバターを更新
   */
  @Put("avatar")
  updateMyAvatarUrl(
    @CurrentUser() user: UserPayload,
    @Body() updateAvatarDto: UpdateAvatarDto,
  ) {
    return this.meService.updateMyAvatarUrl(user.userId, updateAvatarDto);
  }


  /**
   * カード情報付きでプラン変更
   */
  @Patch("plan")
  @UseGuards(JwtAuthGuard)
  async updateMyPlanWithCard(@CurrentUser() user: UserPayload, @Body() updatePlanDto: UpdatePlanDto) {
    return this.meService.updateMyPlan(user.userId, updatePlanDto);
  }

  /**
   * いいねしたアプリ一覧を取得
   */
  @Get("apps/liked")
  findLikedAppList(
    @CurrentUser() user: UserPayload,
    @Query() query: FindLikedAppListQueryDto,
  ) {
    return this.meService.findLikedAppList(user.userId, query);
  }

  /**
   * 請求履歴を取得
   */
  @Get("billing-history")
  findBillingHistory(
    @CurrentUser() user: UserPayload,
  ) {
    return this.meService.findBillingHistory(user.userId);
  }

  /**
   * ブックマークフォルダとブックマークを取得 (DTO使用)
   */
  @Get("bookmark-folders")
  findBookmarkFolderList(@CurrentUser() user: UserPayload) {
    return this.meService.findBookmarkFolderList(user.userId);
  }

  /**
   * アプリがブックマークされているフォルダ情報を取得
   */
  @Get("bookmark-folders/app-status")
  findBookmarkFoldersWithAppStatus(
    @CurrentUser() user: UserPayload,
    @Query("appId", ParseIntPipe) appId: number,
  ) {
    return this.meService.findBookmarkFoldersWithAppStatus(user.userId, appId);
  }

  /**
   * ブックマークフォルダを作成
   */
  @Post("bookmark-folders")
  createBookmarkFolder(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateBookmarkFolderDto,
  ) {
    return this.meService.createBookmarkFolder(user.userId, dto);
  }

  /**
   * ブックマークフォルダを更新
   */
  @Patch("bookmark-folders/:folderId")
  updateBookmarkFolder(
    @CurrentUser() user: UserPayload,
    @Param("folderId", ParseIntPipe) folderId: number,
    @Body() dto: UpdateBookmarkFolderDto,
  ) {
    return this.meService.updateBookmarkFolder(user.userId, folderId, dto);
  }

  /**
   * ブックマークを切り替え
   */
  @Post("bookmarks")
  toggleBookmark(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateBookmarkDto,
  ) {
    return this.meService.toggleBookmark(user.userId, dto);
  }

  /**
   * ブックマークフォルダを削除
   */
  @Delete("/bookmark-folders/:folderId")
  deleteBookmarkFolder(
    @CurrentUser() user: UserPayload,
    @Param("folderId", ParseIntPipe) folderId: number,
  ) {
    return this.meService.deleteBookmarkFolder(user.userId, folderId);
  }

  /**
   * 開発者申請を作成
   */
  @Post("developer-requests")
  requestDeveloperRole(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateDeveloperRequestDto,
  ) {
    return this.meService.requestDeveloperRole(user.userId, dto);
  }

  /**
   * アプリの評価を切り替え
   */
  @Post("ratings/apps/:appId")
  toggleAppRating(
    @CurrentUser() user: UserPayload,
    @Param("appId", ParseIntPipe) appId: number,
    @Body() dto: RateAppDto,
  ) {
    return this.meService.toggleAppRating(user.userId, appId, dto);
  }

  /**
   * フォルダ内のブックマーク一覧を取得
   */
  @Get("bookmark-folders/:folderId/bookmarks")
  findBookmarksInFolder(
    @CurrentUser() user: UserPayload,
    @Param("folderId", ParseIntPipe) folderId: number,
    @Query() query: FindBookmarksInFolderQueryDto,
  ) {
    return this.meService.findBookmarksInFolder(user.userId, folderId, query);
  }
}
