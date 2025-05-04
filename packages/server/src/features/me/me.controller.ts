import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  Req,
  Put,
  HttpCode,
  HttpStatus,
  Query,
  ValidationPipe,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { MeService, MyProfile, BookmarkFolderWithAppStatus } from './me.service'; // Import MeService and MyProfile type from ./me.service
import { UpdateMyPasswordDto } from './dto/update-my-password.dto';
import { UpdateMyAvatarDto } from './dto/update-my-avatar.dto';
import { UpdateMyPlanDto } from './dto/update-my-plan.dto'; // Import Plan DTO
import { UpdateMyNameDto } from './dto/update-my-name.dto'; // Import Name DTO
import { GetLikedAppsQueryDto } from './dto/get-liked-apps-query.dto'; // 作成したDTOをインポート
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard'; // ../../auth/guards/jwt-auth.guard から修正
import { Request } from 'express';
import { User, App, BookmarkFolder, Bookmark, DeveloperRequest, Rating } from '@prisma/client'; // DeveloperRequest を追加
import { CreateBookmarkDto } from './dto/create-bookmark.dto'; // 追加
import { CreateBookmarkFolderDto } from './dto/create-bookmark-folder.dto'; // 追加
import { CreateDeveloperRequestDto } from './dto/create-developer-request.dto'; // 追加
import { RateAppDto } from './dto/rate-app.dto'; // 追加
import { UpdateBookmarkFolderDto } from './dto/update-bookmark-folder.dto'; // 追加
// import { BookmarkFolderEntity } from './entities/bookmark-folder.entity'; // TODO: Entityクラスを作成する
// import { BookmarkEntity } from './entities/bookmark.entity';       // TODO: Entityクラスを作成する

/**
 * 認証済みユーザー自身の情報操作に関するエンドポイントを提供するコントローラー
 */
@UseGuards(JwtAuthGuard) // コントローラー全体にJWT認証ガードを適用
@Controller('me') // パスプレフィックスを /me に設定
export class MeController {
  // サービスを注入 (readonly)
  constructor(private readonly meService: MeService) {} // Inject MeService instead of UsersService

  /**
   * 認証ユーザーのプロファイル情報を取得します。
   * @param req リクエストオブジェクト (ガードによりユーザー情報が付与されている)
   * @returns プロファイル情報
   */
  @Get('profile')
  // @ApiOperation({ summary: '自分のプロファイル取得', description: '認証中のユーザーのプロファイル情報を取得します。' })
  // @ApiResponse({ status: 200, description: 'プロファイル情報。'})
  // @ApiResponse({ status: 401, description: '認証されていません。' })
  getMyProfile(@Req() req: Request): Promise<MyProfile> {
    // req.user から userId を取得する
    const userId = (req.user as any)?.userId;
    if (typeof userId !== 'number') {
        // userId が number 型でない場合はエラー
        console.error('Failed to get valid user ID from request. req.user:', req.user);
        throw new UnauthorizedException('有効なユーザーIDを取得できませんでした。認証トークンを確認してください。');
    }
    return this.meService.getMyProfile(userId);
  }

  /**
   * 認証ユーザーの名前を更新します。
   * @param req リクエストオブジェクト
   * @param updateMyNameDto 更新情報
   * @returns パスワードを除いた更新後のユーザー情報
   */
  @Patch('name')
  // @ApiOperation({ summary: '自分の名前更新', description: '認証中のユーザーの名前を更新します。' })
  // @ApiResponse({ status: 200, description: '更新後のユーザー情報。' })
  // @ApiResponse({ status: 400, description: '入力が不正です。' })
  // @ApiResponse({ status: 401, description: '認証されていません。' })
  updateMyName(@Req() req: Request, @Body() updateMyNameDto: UpdateMyNameDto): Promise<Omit<User, 'password'>> {
    const userId = (req.user as any)?.userId; // .sub から .userId に変更
    // userId の存在チェックを追加 (getMyProfile と同様)
    if (typeof userId !== 'number') {
      throw new UnauthorizedException('有効なユーザーIDを取得できませんでした。');
    }
    return this.meService.updateMyName(userId, updateMyNameDto); // Call meService
  }

  /**
   * 認証ユーザーのパスワードを更新します。
   * @param req リクエストオブジェクト
   * @param updateMyPasswordDto 更新情報
   * @returns 成功メッセージ
   */
  @Patch('password')
  // @ApiOperation({ summary: '自分のパスワード更新', description: '認証中のユーザーのパスワードを更新します。' })
  // @ApiResponse({ status: 200, description: 'パスワードが正常に変更されました。' })
  // @ApiResponse({ status: 400, description: '入力が不正です (例: 新旧パスワードが同じ)。' })
  // @ApiResponse({ status: 401, description: '認証されていないか、現在のパスワードが間違っています。' })
  @HttpCode(HttpStatus.OK)
  updateMyPassword(@Req() req: Request, @Body() updateMyPasswordDto: UpdateMyPasswordDto): Promise<{ message: string }> {
    const userId = (req.user as any)?.userId; // .sub から .userId に変更
    if (typeof userId !== 'number') {
      throw new UnauthorizedException('有効なユーザーIDを取得できませんでした。');
    }
    return this.meService.updateMyPassword(userId, updateMyPasswordDto); // Call meService
  }

  /**
   * 認証ユーザーのアバターURLを更新します。
   * @param req リクエストオブジェクト
   * @param updateMyAvatarDto 更新情報
   * @returns 更新後のアバターURL
   */
  @Put('avatar') // PUTはリソース全体の置換を示すことが多いが、ここではアバターURLのみ更新
  // @ApiOperation({ summary: '自分のアバター更新', description: '認証中のユーザーのアバターURLを設定します。' })
  // @ApiResponse({ status: 200, description: '更新後のアバターURL。' })
  // @ApiResponse({ status: 400, description: '入力が不正です。' })
  // @ApiResponse({ status: 401, description: '認証されていません。' })
  updateMyAvatarUrl(@Req() req: Request, @Body() updateMyAvatarDto: UpdateMyAvatarDto): Promise<{ avatarUrl: string }> {
    const userId = (req.user as any)?.userId; // .sub から .userId に変更
    if (typeof userId !== 'number') {
      throw new UnauthorizedException('有効なユーザーIDを取得できませんでした。');
    }
    return this.meService.updateMyAvatarUrl(userId, updateMyAvatarDto); // Call meService
  }

  /**
   * 認証ユーザーのプランを更新します。
   * @param req リクエストオブジェクト
   * @param updateMyPlanDto 更新情報
   * @returns パスワードを除いた更新後のユーザー情報
   */
  @Patch('plan')
  // @ApiOperation({ summary: '自分のプラン更新', description: '認証中のユーザーの契約プランを更新します。' })
  // @ApiResponse({ status: 200, description: '更新後のユーザー情報。' })
  // @ApiResponse({ status: 400, description: '入力が不正か、既にそのプランに加入済みです。' })
  // @ApiResponse({ status: 401, description: '認証されていません。' })
  // @ApiResponse({ status: 404, description: '指定されたプランが見つかりません。' })
  updateMyPlan(@Req() req: Request, @Body() updateMyPlanDto: UpdateMyPlanDto): Promise<Omit<User, 'password'>> {
    const userId = (req.user as any)?.userId; // .sub から .userId に変更
    if (typeof userId !== 'number') {
      throw new UnauthorizedException('有効なユーザーIDを取得できませんでした。');
    }
    return this.meService.updateMyPlan(userId, updateMyPlanDto); // Call meService
  }

  /**
   * 認証ユーザーが高評価したアプリの一覧を、条件に基づいて取得します。
   * @param req リクエストオブジェクト
   * @param query クエリパラメータ (ソート、フィルタ、ページネーション)
   * @returns 高評価したアプリのリストと総件数
   */
  @Get('apps/liked')
  // @ApiOperation({ summary: '自分が「いいね」したアプリ一覧取得', description: '認証中のユーザーが高評価したアプリの一覧を取得します。' })
  // @ApiResponse({ status: 200, description: '高評価したアプリのリストと総件数。'})
  // @ApiResponse({ status: 401, description: '認証されていません。' })
  getLikedApps(
    @Req() req: Request,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: GetLikedAppsQueryDto,
  ): Promise<{ data: App[]; total: number }> {
    const userId = (req.user as any)?.userId; // .sub から .userId に変更
    if (typeof userId !== 'number') {
      throw new UnauthorizedException('有効なユーザーIDを取得できませんでした。');
    }
    return this.meService.getLikedApps(userId, query);
  }

  /**
   * 認証ユーザーのブックマークフォルダ一覧（と各フォルダのブックマーク）を取得します。
   * @param req リクエストオブジェクト
   * @param bookmarksPage ブックマークのページ番号 (クエリパラメータ)
   * @param bookmarksLimit 1ページあたりのブックマーク数 (クエリパラメータ)
   * @returns ブックマークフォルダのリスト
   */
  @Get('bookmark-folders')
  getBookmarkFoldersWithBookmarks(
    @Req() req: Request,
    @Query('bookmarksPage', new ParseIntPipe({ optional: true })) bookmarksPage?: number,
    @Query('bookmarksLimit', new ParseIntPipe({ optional: true })) bookmarksLimit?: number,
  ): Promise<BookmarkFolder[]> { // 戻り値の型を明示
    const userId = (req.user as any)?.userId;
    if (typeof userId !== 'number') {
      throw new UnauthorizedException('有効なユーザーIDを取得できませんでした。');
    }
    return this.meService.getBookmarkFoldersWithBookmarks(userId, bookmarksPage, bookmarksLimit);
  }

  /**
   * 認証ユーザーのブックマークフォルダ一覧を、指定されたアプリのブックマーク状態付きで取得します。
   * @param req リクエストオブジェクト
   * @param appId アプリID (クエリパラメータ)
   * @returns ブックマークフォルダのリスト (isAppBookmarked フラグ付き)
   */
  @Get('bookmark-folders/app-status')
  getBookmarkFoldersWithAppStatus(
    @Req() req: Request,
    @Query('appId', ParseIntPipe) appId: number, // クエリから appId を取得
  ): Promise<BookmarkFolderWithAppStatus[]> {
    const userId = (req.user as any)?.userId;
    if (typeof userId !== 'number') {
      throw new UnauthorizedException('有効なユーザーIDを取得できませんでした。');
    }
    return this.meService.getBookmarkFoldersWithAppStatus(userId, appId);
  }

  /**
   * 新しいブックマークフォルダを作成します。
   * @param req リクエストオブジェクト
   * @param dto フォルダ作成情報 (name)
   * @returns 作成されたブックマークフォルダ
   */
  @Post('bookmark-folders')
  @HttpCode(HttpStatus.CREATED)
  createBookmarkFolder(
    @Req() req: Request,
    @Body(ValidationPipe) dto: CreateBookmarkFolderDto, // ValidationPipe を適用
  ): Promise<BookmarkFolder> {
    const userId = (req.user as any)?.userId;
    if (typeof userId !== 'number') {
      throw new UnauthorizedException('有効なユーザーIDを取得できませんでした。');
    }
    return this.meService.createBookmarkFolder(userId, dto);
  }

  /**
   * 指定されたブックマークフォルダの名前を更新します。
   * @param req リクエストオブジェクト
   * @param folderId 更新するフォルダのID
   * @param dto 更新情報 (name)
   * @returns 更新されたブックマークフォルダ
   */
  @Patch('bookmark-folders/:folderId')
  // @ApiOperation({ summary: 'ブックマークフォルダ名更新', description: '指定したブックマークフォルダの名前を変更します。' })
  // @ApiParam({ name: 'folderId', description: '更新するフォルダのID', type: Number })
  // @ApiResponse({ status: 200, description: 'フォルダ名が正常に更新されました。', type: BookmarkFolder })
  // @ApiResponse({ status: 400, description: 'リクエストボディが不正、または指定された名前は既に使用されています。' })
  // @ApiResponse({ status: 401, description: '認証されていません。' })
  // @ApiResponse({ status: 403, description: 'デフォルトフォルダの名前は変更できません。' }) // 403 Forbidden が適切かも
  // @ApiResponse({ status: 404, description: 'フォルダが見つかりません。' })
  updateBookmarkFolder(
    @Req() req: Request,
    @Param('folderId', ParseIntPipe) folderId: number,
    @Body(ValidationPipe) dto: UpdateBookmarkFolderDto,
  ): Promise<BookmarkFolder> {
    const userId = (req.user as any)?.userId;
    if (typeof userId !== 'number') {
      throw new UnauthorizedException('有効なユーザーIDを取得できませんでした。');
    }
    return this.meService.updateBookmarkFolder(userId, folderId, dto);
  }

  /**
   * 認証ユーザーのブックマークを作成または削除します (トグル動作)。
   * @param req リクエストオブジェクト
   * @param dto ブックマーク情報 (appId, folderId)
   * @returns 作成されたブックマーク、または削除された場合はnull
   */
  @Post('bookmarks') // エンドポイントパスは変更なし
  @HttpCode(HttpStatus.OK) // 作成時は 201 だが、削除時は 204 が適切。トグルのため 200 OK とする。
  toggleBookmark(
    @Req() req: Request,
    @Body(ValidationPipe) dto: CreateBookmarkDto, // ValidationPipe を適用
  ): Promise<Bookmark | null> {
    const userId = (req.user as any)?.userId;
    if (typeof userId !== 'number') {
      throw new UnauthorizedException('有効なユーザーIDを取得できませんでした。');
    }
    // サービスメソッドの呼び出しを toggleBookmark に変更
    return this.meService.toggleBookmark(userId, dto);
  }

  /**
   * 指定されたブックマークフォルダを削除します。
   * @param req リクエストオブジェクト
   * @param folderId 削除するフォルダのID
   * @returns 成功メッセージ
   */
  @Delete('/bookmark-folders/:folderId')
  @HttpCode(HttpStatus.OK) // 成功メッセージを返すため 200 OK
  deleteBookmarkFolder(
    @Req() req: Request,
    @Param('folderId', ParseIntPipe) folderId: number,
  ): Promise<{ message: string }> {
    const userId = (req.user as any)?.userId;
    if (typeof userId !== 'number') {
      throw new UnauthorizedException('有効なユーザーIDを取得できませんでした。');
    }
    return this.meService.deleteBookmarkFolder(userId, folderId);
  }

  // --- Developer Role Request --- //

  @Post('developer-requests')
  @HttpCode(HttpStatus.CREATED)
  requestDeveloperRole(
    @Req() req: Request,
    @Body(ValidationPipe) dto: CreateDeveloperRequestDto,
  ): Promise<DeveloperRequest> {
    const userId = (req.user as any)?.userId; // .sub から .userId に変更
    if (typeof userId !== 'number') {
      throw new UnauthorizedException('有効なユーザーIDを取得できませんでした。');
    }
    return this.meService.requestDeveloperRole(userId, dto);
  }

  // --- App Rating --- //

  /**
   * 認証ユーザーが指定したアプリを評価 (いいね/よくないね) します。
   * 既に評価が存在する場合、同じタイプなら削除、違うタイプなら更新します。
   * @param req リクエストオブジェクト
   * @param appId 評価するアプリのID
   * @param dto 評価情報 (type: LIKE | DISLIKE)
   * @returns 更新/作成された評価、または削除された場合はnull
   */
  @Post('ratings/apps/:appId') // パスは ratings/apps/:appId がよりRESTful
  @HttpCode(HttpStatus.OK) // 作成/更新/削除を含むため 200 OK
  async toggleAppRating( // メソッド名も変更
    @Req() req: Request,
    @Param('appId', ParseIntPipe) appId: number,
    // ValidationPipe を new でインスタンス化してオプションを渡すのが推奨される
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) dto: RateAppDto,
  ): Promise<Rating | null> { // 戻り値の型を Rating | null に
    const userId = (req.user as any)?.userId;
    if (typeof userId !== 'number') {
      // JwtAuthGuardがあるので基本ここには来ないはずだが念のため
      throw new UnauthorizedException('Invalid user ID.');
    }
    // サービスメソッドの呼び出し名を変更
    return this.meService.toggleAppRating(userId, appId, dto);
  }
} 
