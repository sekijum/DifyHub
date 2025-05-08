import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { prisma } from "@/core/database/prisma.client";
import { App, AppStatus, Prisma } from "@prisma/client";
import { FindAppsListQueryDto, CreateAppDto, UpdateAppDto } from "./dto";
import {
  getPaginationParams,
  createPaginatedResponse,
} from "@/core/utils/pagination.util";
import { PaginatedResponse } from "@/core/types/api-response.type";

// アプリデータと関連情報を結合した型
export interface AppWithDetails extends App {
  category?: {
    id: number;
    name: string;
  } | null;
  tags?: {
    id: number;
    name: string;
  }[];
  subImages?: {
    id: number;
    imageUrl: string;
    order: number;
  }[];
  _count?: {
    ratings: number;
    bookmarks: number;
  };
  likeRatio?: number; // 高評価率
  bookmarkCount?: number; // ブックマーク数
  likesCount?: number; // 高評価数
  dislikesCount?: number; // 低評価数
}

// アプリの統計情報の型
export interface AppStatistics {
  usageCount: number;
  totalRatings: number;
  likesCount: number;
  dislikesCount: number;
  likeRatio: number;
  bookmarkCount: number;
  // 実際のデータが存在しない場合は空配列を返す
  dailyUsage: Array<{
    date: string;
    count: number;
  }>;
  monthlyUsage: Array<{
    month: string;
    count: number;
  }>;
}

@Injectable()
export class DeveloperAppsService {
  private readonly logger = new Logger(DeveloperAppsService.name);

  /**
   * 開発者のアプリ一覧を取得
   */
  async findAppsList(query: FindAppsListQueryDto, developerId: number) {
    try {
      const pagination = getPaginationParams(query);

      // where条件の構築
      const where: Prisma.AppWhereInput = {
        creatorId: developerId, // 自分のアプリのみ取得
      };

      // ステータスによるフィルター
      if (query.status) {
        where.status = query.status;
      }

      // カテゴリーによるフィルター
      if (query.categoryId) {
        where.categoryId = query.categoryId;
      }

      // 検索条件（アプリ名、説明）
      if (pagination.search) {
        where.OR = [
          {
            name: {
              contains: pagination.search,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: pagination.search,
              mode: "insensitive",
            },
          },
        ];
      }

      // データの取得と総件数のカウント
      const [apps, total] = await prisma.$transaction([
        prisma.app.findMany({
          where,
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            ratings: {
              select: {
                type: true,
              },
            },
            _count: {
              select: {
                ratings: true,
                bookmarks: true,
              },
            },
          },
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { [pagination.sortBy]: pagination.sortOrder },
        }),
        prisma.app.count({ where }),
      ]);

      // 高評価率と必要なデータを追加
      const processedApps = apps.map((app) => {
        const likeCount =
          app.ratings?.filter((r) => r.type === "LIKE").length || 0;
        const totalRatings = app._count?.ratings || 0;
        const likeRatio =
          totalRatings > 0 ? Math.round((likeCount / totalRatings) * 100) : 0;

        return {
          ...app,
          likeRatio,
          bookmarkCount: app._count?.bookmarks || 0,
          likesCount: likeCount,
          dislikesCount: totalRatings - likeCount,
        };
      });

      return createPaginatedResponse(
        processedApps,
        total,
        pagination.page,
        pagination.limit,
      );
    } catch (error) {
      this.logger.error(
        `アプリ一覧取得エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException(
        "アプリ一覧の取得中にエラーが発生しました",
      );
    }
  }

  /**
   * アプリ詳細を取得
   */
  async findAppById(id: number, developerId: number) {
    try {
      // 基本的なアプリ情報の取得
      const app = await prisma.app.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
            },
          },
          subImages: {
            orderBy: {
              order: "asc",
            },
          },
          ratings: {
            select: {
              type: true,
            },
          },
          _count: {
            select: {
              ratings: true,
              bookmarks: true,
            },
          },
        },
      });

      if (!app) {
        throw new NotFoundException(`アプリ ID ${id} が見つかりません`);
      }

      // 自分のアプリかどうか確認
      if (app.creatorId !== developerId) {
        throw new ForbiddenException(
          "このアプリにアクセスする権限がありません",
        );
      }

      // 高評価率を計算
      const likesCount = app.ratings.filter((r) => r.type === "LIKE").length;
      const totalRatings = app._count.ratings;
      const dislikesCount = totalRatings - likesCount;
      const likeRatio =
        totalRatings > 0 ? Math.round((likesCount / totalRatings) * 100) : 0;

      const appWithDetails = {
        ...app,
        likesCount,
        dislikesCount,
        likeRatio,
        bookmarkCount: app._count.bookmarks,
      } as AppWithDetails;

      return appWithDetails;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        `アプリ詳細取得エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException(
        "アプリ詳細の取得中にエラーが発生しました",
      );
    }
  }

  /**
   * アプリを新規作成
   */
  async createApp(createDto: CreateAppDto, developerId: number) {
    try {
      const {
        name,
        description,
        thumbnailUrl,
        appUrl,
        categoryId,
        isSubscriptionLimited,
        tagIds,
        subImages,
        status,
      } = createDto;

      // タグの接続データ作成
      const tagsConnect = tagIds?.map((id) => ({ id })) || [];

      // アプリ作成とサブ画像・タグの登録を一つのトランザクションで実行
      const newApp = await prisma.$transaction(async (tx) => {
        // アプリを作成
        const app = await tx.app.create({
          data: {
            name,
            description,
            thumbnailUrl,
            appUrl,
            categoryId,
            isSubscriptionLimited: isSubscriptionLimited ?? false,
            status,
            creatorId: developerId,
            tags:
              tagIds && tagIds.length > 0
                ? {
                    connect: tagsConnect,
                  }
                : undefined,
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            tags: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // サブ画像がある場合は登録
        if (subImages && subImages.length > 0) {
          await Promise.all(
            subImages.map(({ imageUrl, order }) =>
              tx.appSubImage.create({
                data: {
                  appId: app.id,
                  imageUrl,
                  order,
                },
              }),
            ),
          );
        }

        // 作成したアプリを返す（サブ画像も含めて取得）
        return tx.app.findUnique({
          where: { id: app.id },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            tags: {
              select: {
                id: true,
                name: true,
              },
            },
            subImages: {
              orderBy: {
                order: "asc",
              },
            },
            _count: {
              select: {
                ratings: true,
                bookmarks: true,
              },
            },
          },
        });
      });

      return {
        ...newApp,
        likesCount: 0,
        dislikesCount: 0,
        likeRatio: 0,
        bookmarkCount: 0,
      } as AppWithDetails;
    } catch (error) {
      this.logger.error(
        `アプリ作成エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new BadRequestException("アプリの作成に失敗しました");
    }
  }

  /**
   * アプリを更新
   */
  async updateApp(
    id: number,
    updateDto: UpdateAppDto,
    developerId: number,
    files?: {
      thumbnail?: Express.Multer.File[];
      newSubImages?: Express.Multer.File[];
    },
  ) {
    try {
      // アプリの存在確認と権限チェック
      const existingApp = await prisma.app.findUnique({
        where: { id },
      });

      if (!existingApp) {
        throw new NotFoundException(`アプリ ID ${id} が見つかりません`);
      }

      if (existingApp.creatorId !== developerId) {
        throw new ForbiddenException("このアプリを編集する権限がありません");
      }

      // SUSPENDED状態のアプリのみ変更不可
      if (existingApp.status === AppStatus.SUSPENDED) {
        throw new ForbiddenException(
          `${existingApp.status}状態のアプリは編集できません`,
        );
      }

      // DTOが未定義の場合は空オブジェクトを使用
      const safeUpdateDto = updateDto || {};

      // アプリ更新とサブ画像・タグの更新を一つのトランザクションで実行
      const updatedApp = await prisma.$transaction(async (tx) => {
        // 更新データを構築
        const updateData: Prisma.AppUpdateInput = {};

        // 各フィールドを明示的に処理
        if (safeUpdateDto.name !== undefined) {
          updateData.name = safeUpdateDto.name;
        }

        if (safeUpdateDto.description !== undefined) {
          updateData.description = safeUpdateDto.description;
        }

        // サムネイル画像処理
        if (files?.thumbnail && files.thumbnail.length > 0) {
          // TODO: ファイル保存処理（実際にはS3などのストレージサービスに保存）
          // この例では、仮のURLを設定しています
          const thumbnailFile = files.thumbnail[0];
          updateData.thumbnailUrl = `https://example.com/uploads/${thumbnailFile.originalname}`;
        } else if (safeUpdateDto.removeThumbnail) {
          updateData.thumbnailUrl = null;
        }

        if (safeUpdateDto.appUrl !== undefined) {
          updateData.appUrl = safeUpdateDto.appUrl;
        }

        if (safeUpdateDto.isSubscriptionOnly !== undefined) {
          // DTOのフィールド名の違いを修正
          updateData.isSubscriptionLimited = safeUpdateDto.isSubscriptionOnly;
        }

        if (safeUpdateDto.status !== undefined) {
          updateData.status = safeUpdateDto.status;
        }

        // タグ処理
        if (
          safeUpdateDto.tags !== undefined &&
          Array.isArray(safeUpdateDto.tags)
        ) {
          // タグ名の配列からタグを検索または作成
          const tags = await Promise.all(
            safeUpdateDto.tags.map(async (tagName) => {
              if (!tagName) return null;

              // 既存のタグを検索
              let tag = await tx.tag.findFirst({
                where: { name: tagName },
              });

              // タグが存在しない場合は新規作成
              if (!tag) {
                tag = await tx.tag.create({
                  data: { name: tagName },
                });
              }

              return tag;
            }),
          );

          // nullを除外
          const validTags = tags.filter((tag) => tag !== null);

          // まず既存のタグ接続をすべて切断
          await tx.app.update({
            where: { id },
            data: {
              tags: {
                set: [], // すべてのタグ接続をリセット
              },
            },
          });

          // そして新しいタグを接続
          if (validTags.length > 0) {
            await tx.app.update({
              where: { id },
              data: {
                tags: {
                  connect: validTags.map((tag) => ({ id: tag.id })),
                },
              },
            });
          }
        } else if (safeUpdateDto.tagIds !== undefined) {
          // 従来のtagIdsフィールドでの更新処理
          updateData.tags = {
            set: [], // 既存のタグをクリア
            connect: safeUpdateDto.tagIds.map((tagId) => ({ id: tagId })),
          };
        }

        if (safeUpdateDto.categoryId !== undefined) {
          updateData.category = {
            connect: { id: safeUpdateDto.categoryId },
          };
        }

        // アプリを更新
        const app = await tx.app.update({
          where: { id },
          data: updateData,
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            tags: {
              select: {
                id: true,
                name: true,
              },
            },
            subImages: {
              orderBy: {
                order: "asc",
              },
            },
          },
        });

        // サブ画像の処理
        if (safeUpdateDto.subImages !== undefined) {
          // 既存のサブ画像を削除
          await tx.appSubImage.deleteMany({
            where: { appId: id },
          });

          // 新しいサブ画像を登録
          if (safeUpdateDto.subImages.length > 0) {
            await Promise.all(
              safeUpdateDto.subImages.map(async (img, index) => {
                await tx.appSubImage.create({
                  data: {
                    appId: id,
                    imageUrl: img.imageUrl,
                    order: img.order || index,
                  },
                });
              }),
            );
          }
        }

        // 新しいサブ画像のアップロード処理
        if (files?.newSubImages && files.newSubImages.length > 0) {
          // 既存のサブ画像の最大順序を取得
          const maxOrderSubImage = await tx.appSubImage.findFirst({
            where: { appId: id },
            orderBy: { order: "desc" },
          });

          const startOrder = maxOrderSubImage ? maxOrderSubImage.order + 1 : 0;

          // 新しいサブ画像を追加
          await Promise.all(
            files.newSubImages.map(async (file, index) => {
              // TODO: 実際のファイル保存処理
              const imageUrl = `https://example.com/uploads/${file.originalname}`;

              await tx.appSubImage.create({
                data: {
                  appId: id,
                  imageUrl,
                  order: startOrder + index,
                },
              });
            }),
          );
        }

        // 更新後のアプリを再取得（サブ画像も含めて）
        return tx.app.findUnique({
          where: { id },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            tags: {
              select: {
                id: true,
                name: true,
              },
            },
            subImages: {
              orderBy: {
                order: "asc",
              },
            },
            ratings: {
              select: {
                type: true,
              },
            },
            _count: {
              select: {
                ratings: true,
                bookmarks: true,
              },
            },
          },
        });
      });

      // 高評価率を計算
      const likesCount = updatedApp.ratings.filter(
        (r) => r.type === "LIKE",
      ).length;
      const totalRatings = updatedApp._count.ratings;
      const dislikesCount = totalRatings - likesCount;
      const likeRatio =
        totalRatings > 0 ? Math.round((likesCount / totalRatings) * 100) : 0;

      const appWithDetails = {
        ...updatedApp,
        likesCount,
        dislikesCount,
        likeRatio,
        bookmarkCount: updatedApp._count.bookmarks,
      } as AppWithDetails;

      return appWithDetails;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        `アプリ更新エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException(
        "アプリの更新中にエラーが発生しました",
      );
    }
  }

  /**
   * アプリを削除
   */
  async deleteApp(id: number, developerId: number) {
    try {
      // アプリの存在確認と権限チェック
      const app = await prisma.app.findUnique({
        where: { id },
      });

      if (!app) {
        throw new NotFoundException(`アプリ ID ${id} が見つかりません`);
      }

      if (app.creatorId !== developerId) {
        throw new ForbiddenException("このアプリを削除する権限がありません");
      }

      // アプリ削除（関連するサブ画像、ブックマーク、評価も削除）
      await prisma.$transaction([
        // サブ画像の削除
        prisma.appSubImage.deleteMany({
          where: { appId: id },
        }),
        // ブックマークの削除
        prisma.bookmark.deleteMany({
          where: { appId: id },
        }),
        // 評価の削除
        prisma.rating.deleteMany({
          where: { appId: id },
        }),
        // アプリとタグの関連付け解除
        prisma.app.update({
          where: { id },
          data: {
            tags: {
              set: [],
            },
          },
        }),
        // アプリの削除
        prisma.app.delete({
          where: { id },
        }),
      ]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        `アプリ削除エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException(
        "アプリの削除中にエラーが発生しました",
      );
    }
  }

  /**
   * アプリの統計情報を取得
   */
  async findAppStatistics(id: number, developerId: number) {
    try {
      // アプリの存在確認と権限チェック
      const app = await prisma.app.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              ratings: true,
              bookmarks: true,
            },
          },
        },
      });

      if (!app) {
        throw new NotFoundException(`アプリ ID ${id} が見つかりません`);
      }

      if (app.creatorId !== developerId) {
        throw new ForbiddenException(
          "このアプリの統計情報を閲覧する権限がありません",
        );
      }

      // 基本統計情報の取得
      const [likesCount, dislikesCount] = await Promise.all([
        prisma.rating.count({ where: { appId: id, type: "LIKE" } }),
        prisma.rating.count({ where: { appId: id, type: "DISLIKE" } }),
      ]);

      const totalRatings = likesCount + dislikesCount;
      const likeRatio =
        totalRatings > 0 ? Math.round((likesCount / totalRatings) * 100) : 0;
      const bookmarkCount = app._count?.bookmarks || 0;

      // 直近30日間の日付を生成
      const dailyUsage: { date: string; count: number }[] = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split("T")[0];
        // ダミーデータ（実際のプロジェクトでは、実際の使用ログデータをクエリします）
        const count = Math.floor(Math.random() * 20); // ダミーデータ
        dailyUsage.push({ date: dateString, count });
      }

      // 直近12ヶ月の月次データを生成
      const monthlyUsage: { month: string; count: number }[] = [];
      const currentDate = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(currentDate.getMonth() - i);
        const month = date.toISOString().substring(0, 7); // YYYY-MM形式
        // ダミーデータ（実際のプロジェクトでは、実際の使用ログデータをクエリします）
        const count = Math.floor(Math.random() * 100) + 20; // ダミーデータ
        monthlyUsage.push({ month, count });
      }

      return {
        usageCount: app.usageCount,
        totalRatings,
        likesCount,
        dislikesCount,
        likeRatio,
        bookmarkCount,
        dailyUsage,
        monthlyUsage,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        `アプリ統計情報取得エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException(
        "アプリ統計情報の取得中にエラーが発生しました",
      );
    }
  }
}
