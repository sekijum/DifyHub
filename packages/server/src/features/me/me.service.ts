import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { UpdateMyPasswordDto } from './dto/update-my-password.dto';
import { UpdateMyAvatarDto } from './dto/update-my-avatar.dto';
import { UpdateMyPlanDto } from './dto/update-my-plan.dto';
import { UpdateMyNameDto } from './dto/update-my-name.dto';
import { User, Role, DeveloperRequestStatus, Prisma, DeveloperRequest, RatingType, App, AppStatus, Bookmark, BookmarkFolder, Rating } from '@prisma/client';
import { hashPassword, comparePassword } from '@/core/utils/hashing.utils';
import { GetLikedAppsQueryDto } from './dto/get-liked-apps-query.dto';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { CreateBookmarkFolderDto } from './dto/create-bookmark-folder.dto';
import { CreateDeveloperRequestDto } from './dto/create-developer-request.dto';
import { RateAppDto } from './dto/rate-app.dto';
import { UpdateBookmarkFolderDto } from './dto/update-bookmark-folder.dto';

/**
 * 認証済みユーザー自身の情報操作に関する型定義
 */
export type MyProfile = Omit<User, 'password' | 'developerRequests'> & {
  developerStatus: DeveloperRequestStatus | 'UNSUBMITTED';
  developerName: string;
};

/**
 * アプリのブックマーク状態を含むブックマークフォルダ情報
 */
export type BookmarkFolderWithAppStatus = BookmarkFolder & { isAppBookmarked: boolean };

// デフォルトのページネーション設定
const DEFAULT_BOOKMARKS_PAGE = 1;
const DEFAULT_BOOKMARKS_LIMIT = 10; // 1ページあたりのブックマーク数

/**
 * 認証済みユーザー自身の情報（プロフィール、パスワード等）を管理するサービスクラス
 */
@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 開発者申請の履歴リストから最終的なステータスを計算します。
   * 優先度: APPROVED > PENDING > REJECTED > UNSUBMITTED
   * @param requests 開発者申請のリスト (新しいものが先頭にあることを期待)
   * @returns 計算された開発者ステータス
   */
  private _calculateDeveloperStatus(
    requests: Pick<DeveloperRequest, 'status'>[],
  ): DeveloperRequestStatus | 'UNSUBMITTED' {
    if (!requests || requests.length === 0) {
      return 'UNSUBMITTED';
    }
    const hasApproved = requests.some(req => req.status === DeveloperRequestStatus.APPROVED);
    if (hasApproved) return DeveloperRequestStatus.APPROVED;
    const hasPending = requests.some(req => req.status === DeveloperRequestStatus.PENDING);
    if (hasPending) return DeveloperRequestStatus.PENDING;
    return DeveloperRequestStatus.REJECTED;
  }

  /**
   * 認証ユーザーのプロファイル情報を取得します。
   * 必要なフィールドのみを選択し、開発者ステータスを計算して含めます。
   * @param userId ユーザーID
   * @returns プロファイル情報
   * @throws NotFoundException ユーザーが見つからない場合
   */
  async getMyProfile(userId: number): Promise<MyProfile> {
    const userProfileData = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        developerName: true,
        avatarUrl: true,
        role: true,
        planName: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        bio: true,
        developerRequests: {
          select: {
            status: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const developerStatus = this._calculateDeveloperStatus(userProfileData.developerRequests);

    const { developerRequests, ...profileData } = userProfileData;

    return {
      ...profileData,
      developerStatus,
    };
  }

  /**
   * 認証ユーザーの名前を更新します。
   * @param userId ユーザーID
   * @param updateMyNameDto 更新情報
   * @returns パスワードを除いた更新後のユーザー情報
   * @throws NotFoundException ユーザーが見つからない場合
   */
  async updateMyName(userId: number, updateMyNameDto: UpdateMyNameDto): Promise<Omit<User, 'password'>> {
    const { name } = updateMyNameDto;
    await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { name },
        select: {
          id: true, email: true, name: true, avatarUrl: true,
          developerName: true,
          createdAt: true, updatedAt: true, role: true,
          planName: true, status: true,
          bio: true,
        },
      });
      return updatedUser;
    } catch (error) {
      console.error('ユーザー名の更新中にエラーが発生しました:', error);
      throw new InternalServerErrorException('ユーザー名の更新中にエラーが発生しました。');
    }
  }

  /**
   * 認証ユーザーのパスワードを更新します。
   * @param userId ユーザーID
   * @param updateMyPasswordDto 更新情報
   * @returns 成功メッセージ
   * @throws NotFoundException ユーザーが見つからない場合
   * @throws UnauthorizedException 現在のパスワードが一致しない場合
   * @throws BadRequestException 新旧パスワードが同じ場合
   */
  async updateMyPassword(userId: number, updateMyPasswordDto: UpdateMyPasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword } = updateMyPasswordDto;

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('現在のパスワードが正しくありません。');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('新しいパスワードは現在のパスワードと同じにすることはできません。');
    }

    const hashedNewPassword = await hashPassword(newPassword);

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });
      return { message: 'パスワードが正常に変更されました。' };
    } catch (error) {
      console.error('パスワードの更新中にエラーが発生しました:', error);
      throw new InternalServerErrorException('パスワードの更新中にエラーが発生しました。');
    }
  }

  /**
   * 認証ユーザーのアバターURLを更新します。
   * @param userId ユーザーID
   * @param updateMyAvatarDto 更新情報
   * @returns 更新後のアバターURL
   * @throws NotFoundException ユーザーが見つからない場合
   * @throws InternalServerErrorException 更新中に予期せぬエラーが発生した場合
   */
  async updateMyAvatarUrl(userId: number, updateMyAvatarDto: UpdateMyAvatarDto): Promise<{ avatarUrl: string }> {
    const { avatarUrl } = updateMyAvatarDto;
    await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
      });
      return { avatarUrl: avatarUrl ?? '' };
    } catch (error) {
      console.error('アバターURLの更新中にエラーが発生しました:', error);
      throw new InternalServerErrorException('アバターURLの更新中にエラーが発生しました。');
    }
  }

  /**
   * 認証ユーザーのプランを更新します。
   * 注意: Stripe等の課金処理はこのメソッドの責務外です。
   * @param userId ユーザーID
   * @param updateMyPlanDto 更新情報
   * @returns パスワードを除いた更新後のユーザー情報
   * @throws NotFoundException ユーザーまたはプランが見つからない場合
   * @throws BadRequestException 指定されたプランに既に加入済みの場合
   * @throws InternalServerErrorException 更新中に予期せぬエラーが発生した場合
   */
  async updateMyPlan(userId: number, updateMyPlanDto: UpdateMyPlanDto): Promise<Omit<User, 'password'>> {
    const { planName } = updateMyPlanDto;

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await this.prisma.plan.findUniqueOrThrow({ where: { name: planName } });

    if (user.planName === planName) {
      throw new BadRequestException('指定されたプランには既に加入しています。');
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { planName },
        select: {
          id: true, email: true, name: true, avatarUrl: true,
          developerName: true,
          createdAt: true, updatedAt: true, role: true,
          planName: true, status: true,
          bio: true,
        },
      });
      return updatedUser;
    } catch (error) {
      console.error('プランの更新中にエラーが発生しました:', error);
      throw new InternalServerErrorException('プランの更新中にエラーが発生しました。');
    }
  }

  /**
   * 認証ユーザーが高評価 (Like) したアプリの一覧を、条件に基づいて取得します。
   * @param userId ユーザーID
   * @param query クエリパラメータ (ソート、フィルタ、ページネーション)
   * @returns 高評価したアプリのリストと総件数
   */
  async getLikedApps(
    userId: number,
    query: GetLikedAppsQueryDto,
  ): Promise<{ data: App[]; total: number }> {
    const { sortBy, sortOrder, name, description, page, limit } = query;

    // ページネーション計算
    const skip = (page - 1) * limit;
    const take = limit;

    // Prisma の where 条件を構築
    const whereCondition: Prisma.AppWhereInput = {
      // ユーザーが高評価したアプリに絞り込む
      ratings: {
        some: {
          userId: userId,
          type: RatingType.LIKE,
        },
      },
      // 名前フィルタ (部分一致、大文字小文字区別しない)
      ...(name && {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      }),
      // 説明フィルタ (部分一致、大文字小文字区別しない)
      ...(description && {
        description: {
          contains: description,
          mode: 'insensitive',
        },
      }),
      // 必要に応じて他のフィルタ条件を追加 (例: status: AppStatus.PUBLISHED)
      status: AppStatus.PUBLISHED, // 公開中のアプリのみを対象とする例
    };

    // Prisma で検索とカウントを並列実行
    const [apps, total] = await this.prisma.$transaction([
      this.prisma.app.findMany({
        where: whereCondition,
        // ソート条件
        orderBy: {
          [sortBy]: sortOrder,
        },
        // ページネーション
        skip,
        take,
        // 関連データを取得
        include: { 
          creator: { // creator 情報を含める
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            }
          }
          // isSubscriptionLimited は App モデルのフィールドなので自動で含まれる
        },
      }),
      this.prisma.app.count({ where: whereCondition }),
    ]);

    return { data: apps, total };
  }

  /**
   * 認証ユーザーのブックマークフォルダを作成します。
   * 同じ名前のフォルダが既に存在する場合はエラーとなります。
   * @param userId ユーザーID
   * @param dto フォルダ作成情報 (name)
   * @returns 作成されたブックマークフォルダ
   * @throws BadRequestException 同じ名前のフォルダが既に存在する場合
   * @throws InternalServerErrorException データベースエラー
   */
  async createBookmarkFolder(userId: number, dto: CreateBookmarkFolderDto): Promise<BookmarkFolder> {
    const { name } = dto;
    const existingFolder = await this.prisma.bookmarkFolder.findFirst({ where: { userId, name } });
    if (existingFolder) { throw new BadRequestException(`ブックマークフォルダ名 '${name}' は既に使用されています。`); }
    try {
      return await this.prisma.bookmarkFolder.create({ data: { userId, name } });
    } catch (error) { console.error('ブックマークフォルダの作成中にエラー:', error); throw new InternalServerErrorException('ブックマークフォルダの作成中にエラーが発生しました。'); }
  }

  /**
   * 認証ユーザーの指定したブックマークフォルダの名前を更新します。
   * デフォルトフォルダの名前は変更できません。
   * 新しい名前が既に他のフォルダで使用されている場合はエラーとなります。
   * @param userId ユーザーID
   * @param folderId 更新するフォルダID
   * @param dto 更新情報 (name)
   * @returns 更新されたブックマークフォルダ
   * @throws NotFoundException フォルダが見つからない、またはユーザーのものではない場合
   * @throws BadRequestException デフォルトフォルダを変更しようとした場合、または新しい名前が既に使われている場合
   * @throws InternalServerErrorException データベースエラー
   */
  async updateBookmarkFolder(userId: number, folderId: number, dto: UpdateBookmarkFolderDto): Promise<BookmarkFolder> {
    const { name } = dto;
    if (name.trim() === '') {
        throw new BadRequestException('フォルダ名を空にすることはできません。');
    }

    // 1. フォルダの存在確認、所有権確認、デフォルト確認
    const folderToUpdate = await this.prisma.bookmarkFolder.findUnique({
      where: { id: folderId },
    });

    if (!folderToUpdate || folderToUpdate.userId !== userId) {
      throw new NotFoundException(`ID ${folderId} のブックマークフォルダが見つからないか、アクセス権がありません。`);
    }
    if (folderToUpdate.isDefault) {
      throw new BadRequestException('デフォルトのブックマークフォルダの名前は変更できません。');
    }
    // 自分自身の名前への変更は許可 (何もせず成功を返す)
    if (folderToUpdate.name === name) {
        return folderToUpdate;
    }

    // 2. 新しい名前の重複チェック (自分以外のフォルダで)
    const existingFolderWithNewName = await this.prisma.bookmarkFolder.findFirst({
      where: {
        userId,
        name,
        id: { not: folderId }, // 自分自身を除く
      },
    });

    if (existingFolderWithNewName) {
      throw new BadRequestException(`ブックマークフォルダ名 '${name}' は既に使用されています。`);
    }

    // 3. フォルダ名更新
    try {
      return await this.prisma.bookmarkFolder.update({
        where: { id: folderId }, // userId による絞り込みは findUnique で行っているので不要
        data: { name },
      });
    } catch (error) {
      // P2002 (Unique制約違反) は findFirst でチェック済みのはずだが競合を考慮
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException(`ブックマークフォルダ名 '${name}' は既に使用されています。`);
      }
      // P2025 (Update対象が見つからない) も findUnique でチェック済みのはず
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw new NotFoundException(`ID ${folderId} のブックマークフォルダが見つかりませんでした (更新時)。`);
      }
      console.error('ブックマークフォルダ名の更新中にエラー:', error);
      throw new InternalServerErrorException('ブックマークフォルダ名の更新中にエラーが発生しました。');
    }
  }

  /**
   * 認証ユーザーのブックマークフォルダとその中のブックマーク（アプリ情報含む）を取得します。
   * ネストされたブックマークはページネーションされます。
   * @param userId ユーザーID
   * @param bookmarksPage ブックマークのページ番号 (デフォルト: 1)
   * @param bookmarksLimit 1ページあたりのブックマーク数 (デフォルト: 10)
   * @returns ブックマークフォルダのリスト（各フォルダにブックマークのリストと総数を含む）
   */
  async getBookmarkFoldersWithBookmarks(
    userId: number,
    bookmarksPage: number = DEFAULT_BOOKMARKS_PAGE,
    bookmarksLimit: number = DEFAULT_BOOKMARKS_LIMIT,
  ): Promise<BookmarkFolder[]> {
    const skipBookmarks = (bookmarksPage - 1) * bookmarksLimit;
    const takeBookmarks = bookmarksLimit;

    return this.prisma.bookmarkFolder.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }, // フォルダの作成順でソート
      include: {
        // 各フォルダに含まれるブックマーク総数を取得
        _count: {
          select: { bookmarks: true },
        },
        // 各フォルダに含まれるブックマークをページネーションして取得
        bookmarks: {
          skip: skipBookmarks,
          take: takeBookmarks,
          include: {
            app: {
              include: {
                creator: {
                   select: { id: true, name: true, avatarUrl: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }, // ブックマークの作成日時（降順）でソート
        },
      },
    });
  }

  /**
   * 認証ユーザーのブックマークを作成または削除（トグル）します。
   * folderId または folderName のいずれかが必要です。
   * folderName が指定され、該当フォルダが存在しない場合は新規作成されます。
   * @param userId ユーザーID
   * @param dto ブックマーク作成情報 (appId, folderId?, folderName?)
   * @returns 作成/更新されたブックマーク、または削除された場合は null
   * @throws BadRequestException folderId/folderName の指定が不正、またはfolderNameが空文字列の場合
   * @throws NotFoundException アプリが見つからない、または folderId で指定されたフォルダが見つからない/アクセスできない場合
   * @throws InternalServerErrorException データベースエラー
   */
  async toggleBookmark(userId: number, dto: CreateBookmarkDto): Promise<Bookmark | null> {
    const { appId, folderId, folderName } = dto;

    // DTO Validation で大部分はチェックされるが、念のためロジックでも確認
    if ((!folderId && !folderName) || (folderId && folderName)) {
      throw new BadRequestException('folderId または folderName のどちらか一方のみを指定してください。');
    }
    if (folderName !== undefined && folderName !== null && folderName.trim() === '') {
        throw new BadRequestException('folderName を空にすることはできません。');
    }

    // アプリの存在確認
    await this.prisma.app.findUniqueOrThrow({ where: { id: appId } });

    let targetFolderId: number;
    let folderOperation: 'useExisting' | 'createNew' = 'useExisting';

    if (folderId) {
      // --- folderId が指定された場合 --- (既存のロジックと同じ)
      const folder = await this.prisma.bookmarkFolder.findUnique({
        where: { id: folderId },
      });
      if (!folder || folder.userId !== userId) {
        throw new NotFoundException(`ID ${folderId} のブックマークフォルダが見つからないか、アクセス権がありません。`);
      }
      targetFolderId = folderId;
    } else if (folderName) {
      // --- folderName が指定された場合 ---
      const existingFolder = await this.prisma.bookmarkFolder.findFirst({
        where: { userId, name: folderName },
      });

      if (existingFolder) {
        // 既存フォルダが見つかった場合
        targetFolderId = existingFolder.id;
      } else {
        // 既存フォルダが見つからない場合 -> 新規作成フラグを立てる
        folderOperation = 'createNew';
        // targetFolderId はトランザクション内で設定
      }
    } else {
        // このパスには到達しないはず
        throw new InternalServerErrorException('フォルダIDまたはフォルダ名の取得に失敗しました。');
    }

    // --- ブックマークの処理 --- 

    if (folderOperation === 'useExisting') {
      // --- 既存フォルダを使用する場合 (トグル動作) --- 
      const bookmarkWhereUniqueInput: Prisma.BookmarkUserIdAppIdBookmarkFolderIdCompoundUniqueInput = {
          userId,
          appId,
          bookmarkFolderId: targetFolderId, // 確定したフォルダIDを使用
      };
      const existingBookmark = await this.prisma.bookmark.findUnique({
          where: { userId_appId_bookmarkFolderId: bookmarkWhereUniqueInput },
      });

      if (existingBookmark) {
          // ブックマークが存在する場合 -> 削除
          try {
              await this.prisma.bookmark.delete({
                  where: { userId_appId_bookmarkFolderId: bookmarkWhereUniqueInput },
              });
              return null; // 削除したので null を返す
          } catch (error) {
              if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                  throw new NotFoundException(`ブックマークが見つかりませんでした (AppID: ${appId}, FolderID: ${targetFolderId})。`);
              }
              console.error('ブックマークの削除中にエラーが発生しました:', error);
              throw new InternalServerErrorException('ブックマークの削除中にエラーが発生しました。');
          }
      } else {
          // ブックマークが存在しない場合 -> 作成
          try {
              return await this.prisma.bookmark.create({
                  data: { userId, appId, bookmarkFolderId: targetFolderId },
              });
          } catch (error) {
              if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
                  throw new NotFoundException(`フォルダ(ID: ${targetFolderId})またはアプリ(ID: ${appId})が見つかりません。`);
              }
              console.error('ブックマーク作成中にエラーが発生しました:', error);
              throw new InternalServerErrorException('ブックマークの作成中にエラーが発生しました。');
          }
      }
    } else {
      // --- 新規フォルダを作成する場合 (ブックマークは必ず作成) ---
      try {
        return await this.prisma.$transaction(async (tx) => {
          // 1. フォルダを作成
          let newFolder;
          try {
            newFolder = await tx.bookmarkFolder.create({
              data: {
                userId,
                name: folderName!, // folderName は存在することが保証されている
              },
            });
          } catch (error) {
            // フォルダ作成時の P2002 (Unique制約違反) は findFirst でチェック済みのはずだが、競合を考慮
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                 // 念のためもう一度チェック
                 const raceConditionFolder = await tx.bookmarkFolder.findFirst({ where: { userId, name: folderName! } });
                 if (raceConditionFolder) {
                    // 競合で作成済み -> 作成されたフォルダを使う (ブックマーク作成へ進む)
                    newFolder = raceConditionFolder;
                 } else {
                     // その他の P2002 または予期せぬエラー
                     console.error('新規フォルダ作成中に予期せぬエラーが発生しました (競合後): ', error);
                     throw new InternalServerErrorException('フォルダ作成中に予期せぬエラーが発生しました。');
                 }
            } else {
                 console.error('新規フォルダ作成中にエラーが発生しました:', error);
                 throw new InternalServerErrorException('フォルダ作成中にエラーが発生しました。');
            }
          }

          // 2. ブックマークを作成 (新規フォルダなので既存チェック不要)
          try {
            return await tx.bookmark.create({
              data: {
                userId,
                appId,
                bookmarkFolderId: newFolder.id,
              },
            });
          } catch (error) {
              // 主にアプリが存在しない(P2003)か、DBエラー
              if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
                  // アプリは最初にチェック済みだが、トランザクション中に削除された可能性？
                  throw new NotFoundException(`アプリ(ID: ${appId})が見つかりませんでした。`);
              }
               console.error('新規フォルダへのブックマーク作成中にエラーが発生しました:', error);
               throw new InternalServerErrorException('ブックマークの作成中にエラーが発生しました。');
          }
        });
      } catch (error) {
         // transaction 内で throw された NotFoundException や InternalServerErrorException を再スロー
         if (error instanceof NotFoundException || error instanceof InternalServerErrorException || error instanceof BadRequestException) {
           throw error;
         }
         console.error('ブックマーク作成(フォルダ新規作成)トランザクション全体でエラー:', error);
         throw new InternalServerErrorException('ブックマーク処理中にエラーが発生しました。');
      }
    }
  }

  /**
   * 認証ユーザーの指定したブックマークフォルダを削除します。
   * デフォルトフォルダは削除できません。
   * フォルダ内のブックマークもすべて削除されます（カスケード削除）。
   * @param userId ユーザーID
   * @param folderId 削除するフォルダID
   * @returns 成功メッセージ
   * @throws NotFoundException フォルダが見つからない、またはユーザーのものではない場合
   * @throws BadRequestException デフォルトフォルダを削除しようとした場合
   * @throws InternalServerErrorException データベースエラー
   */
  async deleteBookmarkFolder(userId: number, folderId: number): Promise<{ message: string }> {
    // フォルダの存在確認と所有権、デフォルトかどうかの確認
    const folder = await this.prisma.bookmarkFolder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.userId !== userId) {
      throw new NotFoundException(`ID ${folderId} のブックマークフォルダが見つからないか、アクセス権がありません。`);
    }

    if (folder.isDefault) {
      throw new BadRequestException('デフォルトのブックマークフォルダ「後で見る」は削除できません。');
    }

    // フォルダ削除実行
    try {
      await this.prisma.bookmarkFolder.delete({
        where: { id: folderId }, // userId による絞り込みは findUnique で行っているので不要
      });
      return { message: `ブックマークフォルダ '${folder.name}' (ID: ${folderId}) が正常に削除されました。` };
    } catch (error) {
       // P2025: Record to delete does not exist (ほぼ発生しないはず)
       if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
           throw new NotFoundException(`ID ${folderId} のブックマークフォルダが見つかりませんでした。`);
       }
      console.error('ブックマークフォルダの削除中にエラーが発生しました:', error);
      throw new InternalServerErrorException('ブックマークフォルダの削除中にエラーが発生しました。');
    }
  }

  // --- Developer Role Request ---

  /**
   * 認証ユーザーが開発者ロールを申請します。
   * 未申請、または過去の申請が却下(REJECTED)されている場合のみ申請可能です。
   * 既に承認済み(APPROVED)または申請中(PENDING)のリクエストがある場合は申請できません。
   * @param userId 申請するユーザーID
   * @param dto 申請情報 (ポートフォリオURLなど)
   * @returns 作成された開発者申請リクエスト
   * @throws BadRequestException 既に承認済みまたは申請中の場合
   * @throws InternalServerErrorException データベースエラー
   */
  async requestDeveloperRole(userId: number, dto: CreateDeveloperRequestDto): Promise<DeveloperRequest> {
    const { portfolioUrl, reason } = dto;

    // ユーザーの既存の開発者申請を取得 (新しい順)
    const existingRequests = await this.prisma.developerRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // 承認済み(APPROVED)のリクエストが1つでもあれば申請不可
    const isApproved = existingRequests.some(req => req.status === DeveloperRequestStatus.APPROVED);
    if (isApproved) {
      throw new BadRequestException('開発者ロールは既に承認されています。');
    }

    // 最新のリクエストが申請中(PENDING)であれば申請不可
    if (existingRequests.length > 0 && existingRequests[0].status === DeveloperRequestStatus.PENDING) {
      throw new BadRequestException('開発者申請は既に申請中です。承認または却下をお待ちください。');
    }

    // 新しい申請を作成 (未申請 or 過去に却下された場合のみこの処理に到達)
    try {
      const newRequest = await this.prisma.developerRequest.create({
        data: {
          userId,
          portfolioUrl,
          reason,
        },
      });
      return newRequest;
    } catch (error) {
      // 主なエラーは Prisma の制約違反やDB接続エラーなど
      console.error('開発者申請リクエストの作成中にエラーが発生しました:', error);
      // userId が存在しないケースは getMyProfile でカバーされるはず
      throw new InternalServerErrorException('開発者申請リクエストの作成中にエラーが発生しました。');
    }
  }

  /**
   * 認証ユーザーが指定したアプリを評価します。
   * 既に評価が存在する場合、同じタイプなら削除、違うタイプなら更新します。
   * @param userId ユーザーID
   * @param appId 評価するアプリID
   * @param dto 評価情報 (type: LIKE | DISLIKE)
   * @returns 更新後のRatingオブジェクト、または削除された場合はnull
   * @throws NotFoundException アプリが見つからない場合
   * @throws InternalServerErrorException データベースエラー
   */
  async toggleAppRating(userId: number, appId: number, dto: RateAppDto): Promise<Rating | null> {
    const { type } = dto;

    // 1. アプリの存在確認
    await this.prisma.app.findUniqueOrThrow({
      where: { id: appId },
      select: { id: true }, // 存在確認のみなのでidだけ取得
    });

    // 2. 既存の評価を検索
    const existingRating = await this.prisma.rating.findUnique({
      where: { userId_appId: { userId, appId } },
    });

    // 3. 評価の処理分岐
    if (existingRating) {
      // 既存評価あり
      if (existingRating.type === type) {
        // --- 同じタイプ -> 削除 ---
        try {
          await this.prisma.rating.delete({
            where: { userId_appId: { userId, appId } },
          });
          return null; // 削除されたのでnullを返す
        } catch (error) {
          // 削除失敗 (ほぼ発生しないはずだが念のため)
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            // レコードが見つからない (findUniqueの後で削除された場合など)
            console.warn(`Rating not found during delete attempt for userId: ${userId}, appId: ${appId}`);
            return null; // 削除されたものとして扱う
          } else {
            console.error('Rating deletion failed:', error);
            throw new InternalServerErrorException('評価の削除中にエラーが発生しました。');
          }
        }
      } else {
        // --- 違うタイプ -> 更新 ---
        try {
          return await this.prisma.rating.update({
            where: { userId_appId: { userId, appId } },
            data: { type },
          });
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            // レコードが見つからない (findUniqueの後で削除された場合など)
            console.warn(`Rating not found during update attempt for userId: ${userId}, appId: ${appId}`);
            // 本来ならここでエラーだが、操作の冪等性を考えると新規作成にフォールバックする手もある
            // 今回はエラーとして扱う
            throw new NotFoundException('更新対象の評価が見つかりませんでした。');
          } else {
            console.error('Rating update failed:', error);
            throw new InternalServerErrorException('評価の更新中にエラーが発生しました。');
          }
        }
      }
    } else {
      // --- 既存評価なし -> 新規作成 ---
      try {
        return await this.prisma.rating.create({
          data: { userId, appId, type },
        });
      } catch (error) {
        // P2003 (FK違反) はアプリ存在確認で防いでいるはず
        // P2002 (Unique制約違反) も findUnique で確認後なので考えにくい
        console.error('Rating creation failed:', error);
        throw new InternalServerErrorException('評価の作成中にエラーが発生しました。');
      }
    }
  }

  /**
   * 認証ユーザーのブックマークフォルダ一覧を、指定されたアプリのブックマーク状態付きで取得します。
   * @param userId ユーザーID
   * @param appId ブックマーク状態を確認するアプリID
   * @returns 各フォルダに isAppBookmarked フラグが付与されたフォルダリスト
   */
  async getBookmarkFoldersWithAppStatus(userId: number, appId: number): Promise<BookmarkFolderWithAppStatus[]> {
    // 1. ユーザーの全てのブックマークフォルダを取得
    const folders = await this.prisma.bookmarkFolder.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }], // デフォルトフォルダを先頭に、あとは作成順
    });

    if (folders.length === 0) {
      return []; // フォルダがなければ空配列を返す
    }

    // 2. 指定されたアプリがブックマークされているフォルダIDのセットを取得
    const bookmarkedFolderIds = await this.prisma.bookmark.findMany({
      where: {
        userId,
        appId,
        bookmarkFolderId: { in: folders.map(f => f.id) }, // ユーザーのフォルダ内のみ検索
      },
      select: {
        bookmarkFolderId: true,
      },
    }).then(bookmarks => new Set(bookmarks.map(b => b.bookmarkFolderId)));

    // 3. 各フォルダに isAppBookmarked フラグを追加
    const foldersWithStatus: BookmarkFolderWithAppStatus[] = folders.map(folder => ({
      ...folder,
      isAppBookmarked: bookmarkedFolderIds.has(folder.id),
    }));

    return foldersWithStatus;
  }
} 
