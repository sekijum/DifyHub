import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { prisma } from "@/core/database/prisma.client";
import { Prisma, RatingType, AppStatus } from "@prisma/client";
import { FindUserAppListQueryDto } from "./dto";
import { logger } from "@/core/utils";
import {
  createPaginatedResponse,
  getPaginationParams,
} from "@/core/utils/pagination.util";

@Injectable()
export class UsersService {
  /**
   * ユーザー詳細とアプリ一覧を取得
   */
  async findUserById(id: number, query?: FindUserAppListQueryDto) {
    try {
      // 1. ユーザー情報を取得
      const user = await prisma.user.findUniqueOrThrow({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          role: true,
          subscription: {
            select: {
              planName: true,
            },
          },
          bio: true,
        },
      });

      // 2. アプリ取得のためのパラメータ準備
      const {
        skip,
        take,
        page,
        limit,
        sortBy = "usageCount",
        sortOrder = "desc",
      } = getPaginationParams(query);

      // 3. アプリ検索条件 (Where句) の構築
      const where: Prisma.AppWhereInput = {
        creatorId: id,
        status: AppStatus.PUBLISHED, // 公開中のアプリのみを対象とする
      };

      if (query?.search) {
        where.name = {
          contains: query.search,
          mode: "insensitive", // 大文字小文字を区別しない
        };
      }

      // 4. アプリのソート条件 (OrderBy句) の構築
      const orderBy: Prisma.AppOrderByWithRelationInput = {};
      // sortBy が許可されたキーかチェック
      const allowedSortBy: ("createdAt" | "usageCount" | "name")[] = [
        "createdAt",
        "usageCount",
        "name",
      ];
      if (sortBy && allowedSortBy.includes(sortBy as any)) {
        orderBy[sortBy as keyof Prisma.AppOrderByWithRelationInput] = sortOrder;
      } else {
        orderBy.usageCount = "desc"; // デフォルト
      }

      // 5. アプリリストと総数を並行して取得
      const [appsWithoutCounts, totalApps] = await prisma.$transaction([
        prisma.app.findMany({
          where,
          orderBy,
          skip,
          take,
          select: {
            id: true,
            name: true,
            description: true,
            thumbnailUrl: true,
            usageCount: true,
            createdAt: true,
            isSubscriptionLimited: true,
            creatorId: true,
            category: { select: { id: true, name: true } },
          },
        }),
        prisma.app.count({ where }),
      ]);

      // 6. 取得したアプリの評価数を取得
      const appIds = appsWithoutCounts.map((app) => app.id);
      let ratingCountsMap = new Map<
        number,
        { likes: number; dislikes: number }
      >();

      if (appIds.length > 0) {
        const counts = await prisma.rating.groupBy({
          by: ["appId", "type"],
          where: {
            appId: { in: appIds },
          },
          _count: {
            _all: true,
          },
        });

        // 集計結果をMapに格納
        counts.forEach((item) => {
          if (!ratingCountsMap.has(item.appId)) {
            ratingCountsMap.set(item.appId, { likes: 0, dislikes: 0 });
          }
          const current = ratingCountsMap.get(item.appId)!;
          if (item.type === RatingType.LIKE) {
            current.likes = item._count._all;
          } else if (item.type === RatingType.DISLIKE) {
            current.dislikes = item._count._all;
          }
        });
      }

      // 7. アプリ情報に評価数をマージ
      const mappedApps = appsWithoutCounts.map((app) => {
        const counts = ratingCountsMap.get(app.id) || { likes: 0, dislikes: 0 };
        return {
          ...app,
          likesCount: counts.likes,
          dislikesCount: counts.dislikes,
        };
      });

      // 8. 結果を結合して返す
      return {
        ...user, // ユーザー情報
        apps: createPaginatedResponse(mappedApps, totalApps, page, limit),
      };
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`ユーザーID ${id} が見つかりません`);
      }

      logger.error(`ユーザー詳細取得エラー: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(
        "ユーザー詳細の取得に失敗しました",
      );
    }
  }
}
