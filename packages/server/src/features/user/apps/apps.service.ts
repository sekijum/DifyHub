import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from "@nestjs/common";
import { prisma } from "@/core/database/prisma.client";
import { Prisma, AppStatus, RatingType, App } from "@prisma/client";
import { FindAppListQueryDto, FindRecommendedAppListQueryDto } from "./dto";
import { parseIds, buildOrderBy, shuffleArray } from "@/core/utils";
import { logger } from "@/core/utils";
import {
  createPaginatedResponse,
  getPaginationParams,
} from "@/core/utils/pagination.util";

@Injectable()
export class AppsService {
  /**
   * 公開済みアプリ一覧を取得
   */
  async findAppList(query: FindAppListQueryDto) {
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

      const where: Prisma.AppWhereInput = {
        status: AppStatus.PUBLISHED,
        ...(search && { name: { contains: search, mode: "insensitive" } }),
        ...(query.categoryId && { categoryId: { in: [query.categoryId] } }),
        ...(query.tagId && { categoryId: { in: [query.tagId] } }),
      };

      const orderBy = buildOrderBy(sortBy, sortOrder);

      // アプリリストと総件数を取得
      const [appsList, total] = await prisma.$transaction([
        prisma.app.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            creator: { select: { id: true, name: true, avatarUrl: true } },
            category: { select: { id: true, name: true } },
            tags: { select: { id: true, name: true } },
          },
        }),
        prisma.app.count({ where }),
      ]);

      // 評価数を取得
      const appsWithCounts = await this.addRatingCounts(appsList);

      // レスポンスを作成
      return createPaginatedResponse(appsWithCounts, total, page, limit);
    } catch (error) {
      logger.error(`アプリ一覧取得エラー: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException("アプリ一覧の取得に失敗しました");
    }
  }

  /**
   * アプリリストに評価数を追加する
   */
  private async addRatingCounts(appList: Partial<App>[]) {
    const appIds = appList.map((app) => app.id);

    if (appIds.length === 0) {
      return appList;
    }

    try {
      // 評価数を取得
      const counts = await prisma.rating.groupBy({
        by: ["appId", "type"],
        where: {
          appId: { in: appIds },
        },
        _count: {
          _all: true,
        },
      });

      // 評価数をマップに整理
      const countsMap = new Map<number, { likes: number; dislikes: number }>();

      counts.forEach((item) => {
        if (!countsMap.has(item.appId)) {
          countsMap.set(item.appId, { likes: 0, dislikes: 0 });
        }

        const current = countsMap.get(item.appId)!;

        if (item.type === RatingType.LIKE) {
          current.likes = item._count._all;
        } else if (item.type === RatingType.DISLIKE) {
          current.dislikes = item._count._all;
        }
      });

      // アプリデータと評価数を結合
      return appList.map((app) => {
        const counts = countsMap.get(app.id) || { likes: 0, dislikes: 0 };
        return {
          ...app,
          likesCount: counts.likes,
          dislikesCount: counts.dislikes,
        };
      });
    } catch (error) {
      logger.error(`アプリ評価数取得エラー: ${JSON.stringify(error)}`);
      return appList; // エラー時は元のデータをそのまま返す
    }
  }

  /**
   * アプリ詳細を取得
   */
  async findAppById(appId: number, userId?: number) {
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
      const [app, likesCount, dislikesCount] = await Promise.all([
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
      const includedBookmarks = (app as any).bookmarks;
      const includedRatings = (app as any).ratings;

      return {
        ...app,
        isBookmarked: !!(includedBookmarks?.length > 0),
        isLiked: !!(
          includedRatings?.length > 0 &&
          includedRatings[0].type === RatingType.LIKE
        ),
        isDisliked: !!(
          includedRatings?.length > 0 &&
          includedRatings[0].type === RatingType.DISLIKE
        ),
        likesCount,
        dislikesCount,
      };
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`アプリID ${appId} が見つかりません`);
      }
      logger.error(`アプリ詳細取得エラー: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException("アプリ詳細の取得に失敗しました");
    }
  }

  /**
   * アプリ使用回数を更新
   */
  async useApp(appId: number, userId: number) {
    try {
      // アプリデータを検索
      const app = await prisma.app.findUnique({
        where: { id: appId, status: AppStatus.PUBLISHED },
        select: {
          id: true,
          isSubscriptionLimited: true,
        },
      });

      if (!app) {
        throw new NotFoundException(
          `アプリID ${appId} が見つからないか、公開されていません`,
        );
      }

      // サブスクリプション制限確認
      if (app.isSubscriptionLimited) {
        await this.validateUserSubscription(userId);
      }

      // 利用回数を更新
      await prisma.app.update({
        where: { id: appId },
        data: { usageCount: { increment: 1 } },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      logger.error(`アプリ使用回数更新エラー: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(
        "アプリ使用回数の更新に失敗しました",
      );
    }
  }

  /**
   * ユーザーのサブスクリプションを検証
   */
  private async validateUserSubscription(userId: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscription: {
            select: { planName: true },
          },
        },
      });

      if (!user || user.subscription?.planName === "free") {
        throw new ForbiddenException(
          "このアプリは有料プランでのみ利用可能です",
        );
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      logger.error(
        `ユーザーサブスクリプション検証エラー: ${JSON.stringify(error)}`,
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
      const where: Prisma.AppWhereInput = {
        status: AppStatus.PUBLISHED,
        id: { not: currentAppId },
        ...(orConditions.length > 0 && { OR: orConditions }),
      };

      // アプリ取得
      const [apps, total] = await prisma.$transaction([
        prisma.app.findMany({
          where,
          take: fetchLimit,
          include: {
            category: { select: { id: true, name: true } },
            creator: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { usageCount: "desc" },
        }),
        prisma.app.count({ where }),
      ]);

      // ランダム化して指定数に絞り込み
      const shuffledApps = shuffleArray(apps).slice(0, limit);

      // 評価数を追加
      const appsWithCounts = await this.addRatingCounts(shuffledApps);

      // レスポンスを作成
      return createPaginatedResponse(appsWithCounts, total, page, limit);
    } catch (error) {
      logger.error(`おすすめアプリ取得エラー: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(
        "おすすめアプリの取得に失敗しました",
      );
    }
  }
}
