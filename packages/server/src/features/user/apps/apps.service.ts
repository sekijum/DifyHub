import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from "@nestjs/common";
import { prisma } from "@/core/database/prisma.client";
import { Prisma, AppStatus, RatingType, App } from "@prisma/client";
import { FindAppListQueryDto, FindRecommendedAppListQueryDto } from "./dto";
import { AppDto } from "./dto/app.dto";
import { parseIds, buildOrderBy, shuffleArray } from "@/core/utils";
import { logger } from "@/core/utils";
import {
  createPaginatedResponse,
  getPaginationParams,
} from "@/core/utils/pagination.util";

// 外部から参照可能な型定義をエクスポート
export interface AppRatingCounts {
  likeCount: number;
  dislikeCount: number;
  totalRatingCount: number;
  positiveRatingRate: number;
}

export interface AppWithRatings extends Partial<App> {
  likeCount: number;
  dislikeCount: number;
  totalRatingCount: number;
  positiveRatingRate: number;
  creator?: { id: number; name: string; avatarUrl: string | null } | null;
  category?: { id: number; name: string } | null;
}

// アプリ詳細の戻り値型
export interface AppDetailWithRatings extends App {
  isBookmarked: boolean;
  isLiked: boolean;
  isDisliked: boolean;
  likeCount: number;
  dislikeCount: number;
  totalRatingCount: number;
  positiveRatingRate: number;
}

@Injectable()
export class AppsService {
  /**
   * 公開済みアプリ一覧を取得
   */
  async findAppList(query: FindAppListQueryDto) {
    logger.log(`アプリ一覧取得開始: ${JSON.stringify(query)}`);
    
    try {
      const {
        skip,
        take,
        page,
        limit,
        sortBy = "usageCount",
        sortOrder = "desc",
        search,
      } = getPaginationParams(query);

      const whereCondition: Prisma.AppWhereInput = {
        status: AppStatus.PUBLISHED,
        ...(search && { name: { contains: search, mode: "insensitive" } }),
        ...(query.categoryId && { categoryId: { in: [query.categoryId] } }),
        ...(query.tagId && { categoryId: { in: [query.tagId] } }),
      };

      const orderByClause = buildOrderBy(sortBy, sortOrder);

      // アプリリストと総件数を並行取得
      const [publishedAppsList, totalAppsCount] = await prisma.$transaction([
        prisma.app.findMany({
          where: whereCondition,
          orderBy: orderByClause,
          skip,
          take,
          include: {
            creator: { select: { id: true, name: true, avatarUrl: true } },
            category: { select: { id: true, name: true } },
            tags: { select: { id: true, name: true } },
          },
        }),
        prisma.app.count({ where: whereCondition }),
      ]);

      // 評価数とレーティング情報を追加
      const appsWithRatingData = await this.enrichAppsWithRatingData(publishedAppsList);

      // AppDtoに変換
      const appDtos = appsWithRatingData.map(app => new AppDto({
        id: app.id,
        name: app.name,
        description: app.description,
        thumbnailUrl: app.thumbnailUrl,
        creatorId: app.creatorId,
        categoryId: app.categoryId,
        isSubscriptionLimited: app.isSubscriptionLimited,
        usageCount: app.usageCount,
        createdAt: app.createdAt,
        creator: app.creator,
        category: app.category,
        likeCount: app.likeCount,
        dislikeCount: app.dislikeCount,
      }));

      logger.log(`アプリ一覧取得成功: 件数=${totalAppsCount}, ページ=${page}`);
      return createPaginatedResponse(appDtos, totalAppsCount, page, limit);
    } catch (error) {
      logger.error(`アプリ一覧取得エラー: ${error.message}`, error.stack);
      throw new InternalServerErrorException("アプリ一覧の取得に失敗しました");
    }
  }

  /**
   * アプリリストに評価数と評価率データを追加する
   */
  private async enrichAppsWithRatingData(appsList: Partial<App>[]): Promise<AppWithRatings[]> {
    const appIdList = appsList.map((app) => app.id).filter(Boolean);

    if (appIdList.length === 0) {
      return appsList.map(app => this.mapAppWithDefaultRatings(app));
    }

    try {
      // 評価数を取得
      const ratingCounts = await prisma.rating.groupBy({
        by: ["appId", "type"],
        where: {
          appId: { in: appIdList },
        },
        _count: {
          _all: true,
        },
      });

      // 評価数をマップに整理
      const ratingsMapByAppId = this.createRatingsCountMap(ratingCounts);

      // アプリデータと評価数を結合
      return appsList.map((app) => {
        const appRatingData = ratingsMapByAppId.get(app.id);
        return this.mapAppWithRatings(app, appRatingData);
      });
    } catch (error) {
      logger.error(`アプリ評価数取得エラー: ${error.message}`, error.stack);
      // エラー時はデフォルト値で返す
      return appsList.map(app => this.mapAppWithDefaultRatings(app));
    }
  }

  /**
   * 評価数データをマップに変換
   */
  private createRatingsCountMap(ratingCounts: any[]): Map<number, AppRatingCounts> {
    const ratingsMap = new Map<number, AppRatingCounts>();

    ratingCounts.forEach((ratingItem) => {
      if (!ratingsMap.has(ratingItem.appId)) {
        ratingsMap.set(ratingItem.appId, {
          likeCount: 0,
          dislikeCount: 0,
          totalRatingCount: 0,
          positiveRatingRate: 0,
        });
      }

      const currentRatingData = ratingsMap.get(ratingItem.appId)!;

      if (ratingItem.type === RatingType.LIKE) {
        currentRatingData.likeCount = ratingItem._count._all;
      } else if (ratingItem.type === RatingType.DISLIKE) {
        currentRatingData.dislikeCount = ratingItem._count._all;
      }
    });

    // 総評価数と評価率を計算
    ratingsMap.forEach((ratingData) => {
      ratingData.totalRatingCount = ratingData.likeCount + ratingData.dislikeCount;
      ratingData.positiveRatingRate = ratingData.totalRatingCount > 0 
        ? ratingData.likeCount / ratingData.totalRatingCount 
        : 0;
    });

    return ratingsMap;
  }

  /**
   * アプリデータに評価情報をマッピング
   */
  private mapAppWithRatings(app: Partial<App>, ratingData?: AppRatingCounts): AppWithRatings {
    if (ratingData) {
      return {
        ...app,
        likeCount: ratingData.likeCount,
        dislikeCount: ratingData.dislikeCount,
        totalRatingCount: ratingData.totalRatingCount,
        positiveRatingRate: ratingData.positiveRatingRate,
      };
    }

    return this.mapAppWithDefaultRatings(app);
  }

  /**
   * デフォルトの評価データでアプリをマッピング
   */
  private mapAppWithDefaultRatings(app: Partial<App>): AppWithRatings {
    return {
      ...app,
      likeCount: 0,
      dislikeCount: 0,
      totalRatingCount: 0,
      positiveRatingRate: 0,
    };
  }

  /**
   * アプリ詳細を取得
   */
  async findAppById(appId: number, userId?: number): Promise<AppDetailWithRatings> {
    logger.log(`アプリ詳細取得開始: AppID=${appId}, UserID=${userId}`);
    
    try {
      // クエリに必要なinclude句を構築
      const includeClause: Prisma.AppInclude = {
        category: true,
        tags: { select: { id: true, name: true } },
        subImages: { select: { id: true, imageUrl: true } },
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        ...(userId && {
          bookmarks: {
            where: { userId },
            select: { id: true },
            take: 1,
          },
          ratings: {
            where: { userId },
            select: { type: true },
            take: 1,
          },
        }),
      };

      // 並行でアプリデータと評価数を取得
      const [appDetails, likeCount, dislikeCount] = await Promise.all([
        prisma.app.findUniqueOrThrow({
          where: { id: appId, status: AppStatus.PUBLISHED },
          include: includeClause,
        }),
        prisma.rating.count({
          where: { appId, type: RatingType.LIKE },
        }),
        prisma.rating.count({
          where: { appId, type: RatingType.DISLIKE },
        }),
      ]);

      // ユーザー固有データの設定
      const userBookmarks = (appDetails as any).bookmarks;
      const userRatings = (appDetails as any).ratings;

      const totalRatingCount = likeCount + dislikeCount;
      const positiveRatingRate = totalRatingCount > 0 ? likeCount / totalRatingCount : 0;

      logger.log(`アプリ詳細取得成功: AppID=${appId}`);
      return {
        ...appDetails,
        isBookmarked: !!(userBookmarks?.length > 0),
        isLiked: !!(
          userRatings?.length > 0 &&
          userRatings[0].type === RatingType.LIKE
        ),
        isDisliked: !!(
          userRatings?.length > 0 &&
          userRatings[0].type === RatingType.DISLIKE
        ),
        likeCount,
        dislikeCount,
        totalRatingCount,
        positiveRatingRate,
      };
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`アプリID ${appId} が見つかりません`);
      }
      logger.error(`アプリ詳細取得エラー: AppID=${appId}, Error=${error.message}`, error.stack);
      throw new InternalServerErrorException("アプリ詳細の取得に失敗しました");
    }
  }

  /**
   * アプリ使用回数を更新
   */
  async useApp(appId: number, userId: number): Promise<void> {
    logger.log(`アプリ使用開始: AppID=${appId}, UserID=${userId}`);
    
    try {
      // アプリデータを検索
      const appData = await prisma.app.findUnique({
        where: { id: appId, status: AppStatus.PUBLISHED },
        select: {
          id: true,
          isSubscriptionLimited: true,
        },
      });

      if (!appData) {
        throw new NotFoundException(
          `アプリID ${appId} が見つからないか、公開されていません`,
        );
      }

      // サブスクリプション制限確認
      if (appData.isSubscriptionLimited) {
        await this.validateUserSubscriptionAccess(userId);
      }

      // 利用回数を更新
      await prisma.app.update({
        where: { id: appId },
        data: { usageCount: { increment: 1 } },
      });

      logger.log(`アプリ使用成功: AppID=${appId}, UserID=${userId}`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      logger.error(`アプリ使用回数更新エラー: AppID=${appId}, UserID=${userId}, Error=${error.message}`, error.stack);
      throw new InternalServerErrorException(
        "アプリ使用回数の更新に失敗しました",
      );
    }
  }

  /**
   * ユーザーのサブスクリプションアクセス権を検証
   */
  private async validateUserSubscriptionAccess(userId: number): Promise<void> {
    try {
      const userData = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscription: {
            select: { planName: true },
          },
        },
      });

      if (!userData || userData.subscription?.planName === "free") {
        throw new ForbiddenException(
          "このアプリは有料プランでのみ利用可能です",
        );
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      logger.error(
        `ユーザーサブスクリプション検証エラー: UserID=${userId}, Error=${error.message}`, error.stack
      );
      throw new InternalServerErrorException(
        "ユーザーサブスクリプションの検証に失敗しました",
      );
    }
  }

  /**
   * おすすめアプリ一覧を取得
   */
  async findRecommendedAppList(
    currentAppId: number,
    query: FindRecommendedAppListQueryDto,
  ) {
    logger.log(`おすすめアプリ取得開始: CurrentAppID=${currentAppId}, Query=${JSON.stringify(query)}`);
    
    try {
      const { limit, page } = getPaginationParams(query);
      const { categoryId, tagIds } = query;
      const fetchLimit = Math.min(limit * 3, 50);

      // OR条件の構築
      const orConditions: Prisma.AppWhereInput[] = [];

      if (categoryId) {
        orConditions.push({ categoryId });
      }

      if (tagIds?.length > 0) {
        orConditions.push({ tags: { some: { id: { in: tagIds } } } });
      }

      // 検索条件構築
      const whereCondition: Prisma.AppWhereInput = {
        status: AppStatus.PUBLISHED,
        id: { not: currentAppId },
        ...(orConditions.length > 0 && { OR: orConditions }),
      };

      // アプリ取得
      const [recommendedApps, totalCount] = await prisma.$transaction([
        prisma.app.findMany({
          where: whereCondition,
          take: fetchLimit,
          include: {
            category: { select: { id: true, name: true } },
            creator: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { usageCount: "desc" },
        }),
        prisma.app.count({ where: whereCondition }),
      ]);

      // ランダム化して指定数に絞り込み
      const shuffledApps = shuffleArray(recommendedApps).slice(0, limit);

      // 評価数を追加
      const appsWithRatingData = await this.enrichAppsWithRatingData(shuffledApps);

      logger.log(`おすすめアプリ取得成功: CurrentAppID=${currentAppId}, Count=${shuffledApps.length}`);
      return createPaginatedResponse(appsWithRatingData, totalCount, page, limit);
    } catch (error) {
      logger.error(`おすすめアプリ取得エラー: CurrentAppID=${currentAppId}, Error=${error.message}`, error.stack);
      throw new InternalServerErrorException(
        "おすすめアプリの取得に失敗しました",
      );
    }
  }
}
