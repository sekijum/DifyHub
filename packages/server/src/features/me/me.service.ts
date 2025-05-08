import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { prisma } from "@/core/database/prisma.client";
import {
  User,
  DeveloperRequestStatus,
  Prisma,
  DeveloperRequest,
  RatingType,
  App,
  AppStatus,
  Bookmark,
  BookmarkFolder,
  Rating,
} from "@prisma/client";
import {
  hashPassword,
  comparePassword,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
} from "@/core/utils";
import { square } from "@/core/square/square.client";
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
import { getPaginationParams } from "@/core/utils/pagination.util";
import { createPaginatedResponse } from "@/core/utils/pagination.util";

@Injectable()
export class MeService {
  private readonly logger = new Logger(MeService.name);

  // 開発者ステータスを計算
  private calculateDeveloperStatus(
    requests: Pick<DeveloperRequest, "status">[],
  ): DeveloperRequestStatus | "UNSUBMITTED" {
    if (!requests || requests.length === 0) {
      return "UNSUBMITTED";
    }

    if (
      requests.some((req) => req.status === DeveloperRequestStatus.APPROVED)
    ) {
      return DeveloperRequestStatus.APPROVED;
    }

    if (requests.some((req) => req.status === DeveloperRequestStatus.PENDING)) {
      return DeveloperRequestStatus.PENDING;
    }

    return DeveloperRequestStatus.REJECTED;
  }

  // ユーザープロフィール情報取得
  async findMyProfile(userId: number) {
    const userData = await this.findUserWithProfileData(userId);
    const developerStatus = this.calculateDeveloperStatus(
      userData.developerRequests,
    );
    const { developerRequests, subscription, ...profileData } = userData;

    return {
      ...profileData,
      planName: subscription?.planName || null,
      developerStatus,
    };
  }

  // ユーザー名更新
  async updateMyName(userId: number, updateNameDto: UpdateNameDto) {
    await this.findUserOrThrow(userId);

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { name: updateNameDto.name },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          developerName: true,
          createdAt: true,
          updatedAt: true,
          role: true,
          status: true,
          bio: true,
          subscription: { select: { planName: true } },
        },
      });

      const { subscription, ...userData } = updatedUser;
      return {
        ...userData,
        planName: subscription?.planName || null,
      };
    } catch (error) {
      this.logger.error("ユーザー名更新エラー", { userId, error });
      throw new InternalServerErrorException(
        "ユーザー名の更新中にエラーが発生しました",
      );
    }
  }

  // パスワード更新
  async updateMyPassword(userId: number, updatePasswordDto: UpdatePasswordDto) {
    const { currentPassword, newPassword } = updatePasswordDto;
    const user = await this.findUserOrThrow(userId);

    // 現在のパスワード確認
    if (!(await comparePassword(currentPassword, user.password))) {
      throw new UnauthorizedException("現在のパスワードが正しくありません");
    }

    // 新旧パスワード同一チェック
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        "新しいパスワードは現在のパスワードと同じにできません",
      );
    }

    try {
      const hashedNewPassword = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });
      return { message: "パスワードが正常に変更されました" };
    } catch (error) {
      this.logger.error("パスワード更新エラー", { userId, error });
      throw new InternalServerErrorException(
        "パスワードの更新中にエラーが発生しました",
      );
    }
  }

  // アバターURL更新
  async updateMyAvatarUrl(userId: number, updateAvatarDto: UpdateAvatarDto) {
    await this.findUserOrThrow(userId);

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: updateAvatarDto.avatarUrl },
      });
      return { avatarUrl: updateAvatarDto.avatarUrl ?? "" };
    } catch (error) {
      this.logger.error("アバターURL更新エラー", { userId, error });
      throw new InternalServerErrorException(
        "アバターURLの更新中にエラーが発生しました",
      );
    }
  }

  // プラン更新
  async updateMyPlan(userId: number, updatePlanDto: UpdatePlanDto) {
    const { planName } = updatePlanDto;

    // ユーザーと現在のサブスクリプション情報取得
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user.subscription) {
      throw new BadRequestException("サブスクリプション情報が見つかりません");
    }

    // 新プラン情報取得
    const newPlan = await prisma.plan.findUniqueOrThrow({
      where: { name: planName },
    });

    // 同一プランチェック
    if (user.subscription.planName === planName) {
      throw new BadRequestException("指定されたプランには既に加入しています");
    }

    try {
      // トランザクション開始
      return await prisma.$transaction(async (tx) => {
        const subscriptionData = {
          planName: planName,
        } as Prisma.SubscriptionUpdateInput;

        // Square顧客ID存在チェック
        if (!user.subscription.squareCustomerId) {
          this.logger.warn("Square顧客ID未設定", { userId });
          throw new BadRequestException(
            "Square顧客情報がないためプラン変更できません",
          );
        }

        // プラン変更処理
        try {
          // Square APIでプラン変更
          try {
            await square.subscriptions.swapPlan({
              subscriptionId: user.subscription.squareSubscriptionId,
              newPlanVariationId: newPlan.squareCatalogId,
            });
          } catch (error) {
            this.logger.error("Square API プラン変更エラー", { error });
            throw error;
          }
        } catch (error) {
          this.logger.error("サブスクリプションプラン変更エラー", {
            userId,
            error,
          });
          throw new InternalServerErrorException(
            "サブスクリプション変更中にエラーが発生しました",
          );
        }

        // DB更新
        return await tx.user.update({
          where: { id: userId },
          data: {
            subscription: { update: subscriptionData },
          },
          include: { subscription: true },
        });
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error("プラン更新エラー", { userId, error });
      throw new InternalServerErrorException(
        "プランの更新中にエラーが発生しました",
      );
    }
  }

  // いいねしたアプリ一覧取得
  async findLikedAppList(userId: number, query: FindLikedAppListQueryDto) {
    const { sortBy, sortOrder, page, limit } = query;
    const skip = (page - 1) * limit;

    // 検索条件構築
    const whereCondition: Prisma.AppWhereInput = {
      ratings: {
        some: {
          userId: userId,
          type: RatingType.LIKE,
        },
      },
      status: AppStatus.PUBLISHED,
    };

    // 検索実行
    const [apps, total] = await prisma.$transaction([
      prisma.app.findMany({
        where: whereCondition,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.app.count({ where: whereCondition }),
    ]);

    return { data: apps, total };
  }

  // ブックマークフォルダ作成
  async createBookmarkFolder(userId: number, dto: CreateBookmarkFolderDto) {
    const { name } = dto;

    // 同名フォルダ存在チェック
    const existingFolder = await prisma.bookmarkFolder.findFirst({
      where: { userId, name },
    });

    if (existingFolder) {
      throw new BadRequestException(
        `ブックマークフォルダ名 '${name}' は既に使用されています`,
      );
    }

    try {
      return await prisma.bookmarkFolder.create({
        data: { userId, name },
      });
    } catch (error) {
      this.logger.error("ブックマークフォルダ作成エラー", { userId, error });
      throw new InternalServerErrorException(
        "ブックマークフォルダの作成中にエラーが発生しました",
      );
    }
  }

  // ブックマークフォルダ名更新
  async updateBookmarkFolder(
    userId: number,
    folderId: number,
    dto: UpdateBookmarkFolderDto,
  ) {
    const { name } = dto;

    // 空名チェック
    if (name.trim() === "") {
      throw new BadRequestException("フォルダ名を空にすることはできません");
    }

    // フォルダ存在チェック
    const folder = await this.findBookmarkFolderOrThrow(userId, folderId);

    // デフォルトフォルダチェック
    if (folder.isDefault) {
      throw new BadRequestException(
        "デフォルトのブックマークフォルダの名前は変更できません",
      );
    }

    // 同名チェック
    if (folder.name === name) {
      return folder;
    }

    // 新名前の重複チェック
    const existingFolder = await prisma.bookmarkFolder.findFirst({
      where: {
        userId,
        name,
        id: { not: folderId },
      },
    });

    if (existingFolder) {
      throw new BadRequestException(
        `ブックマークフォルダ名 '${name}' は既に使用されています`,
      );
    }

    // 更新実行
    try {
      return await prisma.bookmarkFolder.update({
        where: { id: folderId },
        data: { name },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new BadRequestException(
            `ブックマークフォルダ名 '${name}' は既に使用されています`,
          );
        }
        if (error.code === "P2025") {
          throw new NotFoundException(
            `ID ${folderId} のブックマークフォルダが見つかりませんでした`,
          );
        }
      }
      this.logger.error("ブックマークフォルダ更新エラー", {
        userId,
        folderId,
        error,
      });
      throw new InternalServerErrorException(
        "ブックマークフォルダ名の更新中にエラーが発生しました",
      );
    }
  }

  // ブックマークフォルダ一覧取得（ブックマーク数のみ含む）
  async findBookmarkFolderList(userId: number) {
    return await prisma.bookmarkFolder.findMany({
      where: { userId },
      orderBy: { id: "desc" },
      include: {
        _count: { select: { bookmarks: true } },
      },
    });
  }

  // ブックマーク一覧取得（フォルダごと）
  async findBookmarksInFolder(
    userId: number,
    folderId: number,
    query: FindBookmarksInFolderQueryDto,
  ) {
    // フォルダ存在確認
    await this.findBookmarkFolderOrThrow(userId, folderId);

    const pagination = getPaginationParams(query);

    const [bookmarks, total] = await prisma.$transaction([
      prisma.bookmark.findMany({
        where: {
          userId,
          bookmarkFolderId: folderId,
        },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: {
          app: {
            include: {
              creator: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      }),
      prisma.bookmark.count({
        where: {
          userId,
          bookmarkFolderId: folderId,
        },
      }),
    ]);

    return createPaginatedResponse(
      bookmarks,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  // ブックマークトグル（作成/削除）
  async toggleBookmark(userId: number, dto: CreateBookmarkDto) {
    const { appId, folderId, folderName } = dto;

    // フォルダ指定チェック
    if ((!folderId && !folderName) || (folderId && folderName)) {
      throw new BadRequestException(
        "folderId または folderName のどちらか一方のみを指定してください",
      );
    }

    // フォルダ名空チェック
    if (
      folderName !== undefined &&
      folderName !== null &&
      folderName.trim() === ""
    ) {
      throw new BadRequestException("folderName を空にすることはできません");
    }

    // アプリ存在チェック
    await prisma.app.findUniqueOrThrow({ where: { id: appId } });

    let targetFolderId: number;
    let folderOperation: "useExisting" | "createNew" = "useExisting";

    // フォルダID取得処理
    if (folderId) {
      const folder = await this.findBookmarkFolderOrThrow(userId, folderId);
      targetFolderId = folderId;
    } else if (folderName) {
      const existingFolder = await prisma.bookmarkFolder.findFirst({
        where: { userId, name: folderName },
      });

      if (existingFolder) {
        targetFolderId = existingFolder.id;
      } else {
        folderOperation = "createNew";
      }
    } else {
      throw new InternalServerErrorException(
        "フォルダIDまたはフォルダ名の取得に失敗しました",
      );
    }

    // ブックマーク処理
    if (folderOperation === "useExisting") {
      return await this.toggleExistingBookmark(userId, appId, targetFolderId);
    } else {
      return await this.createFolderAndBookmark(userId, appId, folderName!);
    }
  }

  // ブックマークフォルダ削除
  async deleteBookmarkFolder(userId: number, folderId: number) {
    // フォルダ存在チェック
    const folder = await this.findBookmarkFolderOrThrow(userId, folderId);

    // デフォルトフォルダ削除不可
    if (folder.isDefault) {
      throw new BadRequestException(
        "デフォルトのブックマークフォルダ「後で見る」は削除できません",
      );
    }

    // 削除実行
    try {
      await prisma.bookmarkFolder.delete({
        where: { id: folderId },
      });
      return {
        message: `ブックマークフォルダ '${folder.name}' (ID: ${folderId}) が正常に削除されました`,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException(
          `ID ${folderId} のブックマークフォルダが見つかりませんでした`,
        );
      }
      this.logger.error("ブックマークフォルダ削除エラー", {
        userId,
        folderId,
        error,
      });
      throw new InternalServerErrorException(
        "ブックマークフォルダの削除中にエラーが発生しました",
      );
    }
  }

  // 開発者ロール申請
  async requestDeveloperRole(userId: number, dto: CreateDeveloperRequestDto) {
    const { portfolioUrl, reason } = dto;

    // 既存申請チェック
    const existingRequests = await prisma.developerRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // 承認済みチェック
    if (
      existingRequests.some(
        (req) => req.status === DeveloperRequestStatus.APPROVED,
      )
    ) {
      throw new BadRequestException("開発者ロールは既に承認されています");
    }

    // 申請中チェック
    if (
      existingRequests.length > 0 &&
      existingRequests[0].status === DeveloperRequestStatus.PENDING
    ) {
      throw new BadRequestException(
        "開発者申請は既に申請中です。承認または却下をお待ちください",
      );
    }

    // 新規申請作成
    try {
      return await prisma.developerRequest.create({
        data: {
          userId,
          portfolioUrl,
          reason,
        },
      });
    } catch (error) {
      this.logger.error("開発者申請エラー", { userId, error });
      throw new InternalServerErrorException(
        "開発者申請リクエストの作成中にエラーが発生しました",
      );
    }
  }

  // アプリ評価トグル
  async toggleAppRating(userId: number, appId: number, dto: RateAppDto) {
    const { type } = dto;

    // アプリ存在チェック
    await prisma.app.findUniqueOrThrow({
      where: { id: appId },
      select: { id: true },
    });

    // 既存評価検索
    const existingRating = await prisma.rating.findUnique({
      where: { userId_appId: { userId, appId } },
    });

    // 評価処理
    if (existingRating) {
      return await this.updateOrDeleteRating(
        userId,
        appId,
        type,
        existingRating,
      );
    } else {
      // 新規作成
      try {
        return await prisma.rating.create({
          data: { userId, appId, type },
        });
      } catch (error) {
        this.logger.error("評価作成エラー", { userId, appId, error });
        throw new InternalServerErrorException(
          "評価の作成中にエラーが発生しました",
        );
      }
    }
  }

  // アプリごとのブックマークフォルダ状態取得
  async findBookmarkFoldersWithAppStatus(userId: number, appId: number) {
    // フォルダ一覧取得
    const folders = await prisma.bookmarkFolder.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    if (folders.length === 0) {
      return [];
    }

    // ブックマーク状態取得
    const bookmarkedFolderIds = await prisma.bookmark
      .findMany({
        where: {
          userId,
          appId,
          bookmarkFolderId: { in: folders.map((f) => f.id) },
        },
        select: {
          bookmarkFolderId: true,
        },
      })
      .then((bookmarks) => new Set(bookmarks.map((b) => b.bookmarkFolderId)));

    // 状態付きフォルダ一覧作成
    return folders.map((folder) => ({
      ...folder,
      isAppBookmarked: bookmarkedFolderIds.has(folder.id),
    }));
  }

  // 以下、プライベートヘルパーメソッド

  // ユーザープロフィールデータ取得処理
  private async findUserWithProfileData(userId: number) {
    try {
      return await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          developerName: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          status: true,
          bio: true,
          developerRequests: {
            select: { status: true },
            orderBy: { createdAt: "desc" },
          },
          subscription: {
            select: { planName: true },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException(`ユーザーID ${userId} が見つかりません`);
      }
      throw error;
    }
  }

  // ユーザー取得共通処理
  private async findUserOrThrow(userId: number) {
    try {
      return await prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException(`ユーザーID ${userId} が見つかりません`);
      }
      throw error;
    }
  }

  // ブックマークフォルダ取得共通処理
  private async findBookmarkFolderOrThrow(userId: number, folderId: number) {
    const folder = await prisma.bookmarkFolder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw new NotFoundException(
        `ID ${folderId} のブックマークフォルダが見つかりません`,
      );
    }

    if (folder.userId !== userId) {
      throw new UnauthorizedException(
        `ID ${folderId} のブックマークフォルダへのアクセス権がありません`,
      );
    }

    return folder;
  }

  // 既存ブックマークトグル処理
  private async toggleExistingBookmark(
    userId: number,
    appId: number,
    folderId: number,
  ) {
    const bookmarkWhereInput = {
      userId,
      appId,
      bookmarkFolderId: folderId,
    };

    const existingBookmark = await prisma.bookmark.findUnique({
      where: { userId_appId_bookmarkFolderId: bookmarkWhereInput },
    });

    if (existingBookmark) {
      // 削除処理
      try {
        await prisma.bookmark.delete({
          where: { userId_appId_bookmarkFolderId: bookmarkWhereInput },
        });
        return null;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2025"
        ) {
          throw new NotFoundException(
            `ブックマークが見つかりませんでした (AppID: ${appId}, FolderID: ${folderId})`,
          );
        }
        this.logger.error("ブックマーク削除エラー", {
          userId,
          appId,
          folderId,
          error,
        });
        throw new InternalServerErrorException(
          "ブックマークの削除中にエラーが発生しました",
        );
      }
    } else {
      // 作成処理
      try {
        return await prisma.bookmark.create({
          data: { userId, appId, bookmarkFolderId: folderId },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2003"
        ) {
          throw new NotFoundException(
            `フォルダ(ID: ${folderId})またはアプリ(ID: ${appId})が見つかりません`,
          );
        }
        this.logger.error("ブックマーク作成エラー", {
          userId,
          appId,
          folderId,
          error,
        });
        throw new InternalServerErrorException(
          "ブックマークの作成中にエラーが発生しました",
        );
      }
    }
  }

  // フォルダ作成＆ブックマーク処理
  private async createFolderAndBookmark(
    userId: number,
    appId: number,
    folderName: string,
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        // フォルダ作成
        let newFolder;
        try {
          newFolder = await tx.bookmarkFolder.create({
            data: {
              userId,
              name: folderName,
            },
          });
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            // 競合チェック
            const folder = await tx.bookmarkFolder.findFirst({
              where: { userId, name: folderName },
            });
            if (folder) {
              newFolder = folder;
            } else {
              this.logger.error("フォルダ作成エラー", {
                userId,
                folderName,
                error,
              });
              throw new InternalServerErrorException(
                "フォルダ作成中に予期せぬエラーが発生しました",
              );
            }
          } else {
            this.logger.error("フォルダ作成エラー", {
              userId,
              folderName,
              error,
            });
            throw new InternalServerErrorException(
              "フォルダ作成中にエラーが発生しました",
            );
          }
        }

        // ブックマーク作成
        try {
          return await tx.bookmark.create({
            data: {
              userId,
              appId,
              bookmarkFolderId: newFolder.id,
            },
          });
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2003"
          ) {
            throw new NotFoundException(
              `アプリ(ID: ${appId})が見つかりませんでした`,
            );
          }
          this.logger.error("ブックマーク作成エラー", {
            userId,
            appId,
            folderName,
            error,
          });
          throw new InternalServerErrorException(
            "ブックマークの作成中にエラーが発生しました",
          );
        }
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error("ブックマーク処理エラー", {
        userId,
        appId,
        folderName,
        error,
      });
      throw new InternalServerErrorException(
        "ブックマーク処理中にエラーが発生しました",
      );
    }
  }

  // 評価更新/削除処理
  private async updateOrDeleteRating(
    userId: number,
    appId: number,
    type: RatingType,
    existingRating: Rating,
  ) {
    if (existingRating.type === type) {
      // 同一タイプなら削除
      try {
        await prisma.rating.delete({
          where: { userId_appId: { userId, appId } },
        });
        return null;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2025"
        ) {
          return null;
        }
        this.logger.error("評価削除エラー", { userId, appId, error });
        throw new InternalServerErrorException(
          "評価の削除中にエラーが発生しました",
        );
      }
    } else {
      // 異なるタイプなら更新
      try {
        return await prisma.rating.update({
          where: { userId_appId: { userId, appId } },
          data: { type },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2025"
        ) {
          throw new NotFoundException("更新対象の評価が見つかりませんでした");
        }
        this.logger.error("評価更新エラー", { userId, appId, error });
        throw new InternalServerErrorException(
          "評価の更新中にエラーが発生しました",
        );
      }
    }
  }
}
