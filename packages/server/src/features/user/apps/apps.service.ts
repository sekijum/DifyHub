import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { GetAppsQueryDto } from './dto/get-apps-query.dto';
import { GetRecommendedAppsQueryDto } from './dto/get-recommended-apps-query.dto';
import { AppDto } from './dto/app.dto';
import { AppListResponseDto } from './dto/app-list-response.dto';
import { Prisma, AppStatus, RatingType, App, Category, User } from '@prisma/client';
import { AppDetailDto } from './dto/app-detail.dto';

// Helper function for shuffling array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

// ★ Define a type combining App with included data and counts
type AppWithIncludedDataAndCounts = App & {
  category?: Pick<Category, 'id' | 'name'> | null;
  creator?: Pick<User, 'id' | 'name' | 'avatarUrl'> | null;
  likesCount?: number;
  dislikesCount?: number;
};

@Injectable()
export class AppsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetAppsQueryDto): Promise<AppListResponseDto> {
    const { page, limit, sortBy, sortOrder, name, categoryId, tag } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    // --- Helper Function to parse ID array/string --- 
    const parseIds = (ids: string | string[] | undefined): number[] | undefined => {
      if (!ids) return undefined;
      const idArray = Array.isArray(ids) ? ids : [ids];
      return idArray.map(id => parseInt(id, 10)).filter(num => !isNaN(num)); // Filter out NaN
    };

    const categoryIds = parseIds(categoryId);
    const tags = Array.isArray(tag) ? tag : (tag ? [tag] : undefined);

    const where: Prisma.AppWhereInput = {
      status: AppStatus.PUBLISHED,
      // 名前フィルター
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      // カテゴリーIDフィルター (複数対応)
      ...(categoryIds && categoryIds.length > 0 && { categoryId: { in: categoryIds } }),
      // タグフィルター (複数対応 - いずれかを含む)
      ...(tags && tags.length > 0 && {
        tags: {
          some: {
            name: { in: tags }
          }
        }
      }),
    };

    const orderBy: Prisma.AppOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // アプリリストと総件数を取得 (評価数は後で取得)
    const [appsWithoutCounts, total] = await this.prisma.$transaction([
      this.prisma.app.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { 
          category: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true, avatarUrl: true } }
         } 
      }),
      this.prisma.app.count({ where }),
    ]);

    // ★ Get ratings counts for the fetched apps
    const appIds = appsWithoutCounts.map(app => app.id);
    let ratingCounts: { appId: number; likes: number; dislikes: number }[] = [];

    if (appIds.length > 0) {
        const counts = await this.prisma.rating.groupBy({
            by: ['appId', 'type'],
            where: {
                appId: { in: appIds },
            },
            _count: {
                _all: true,
            },
        });

        // Process counts into a more usable format
        const countsMap = new Map<number, { likes: number; dislikes: number }>();
        counts.forEach(item => {
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
        ratingCounts = Array.from(countsMap.entries()).map(([appId, counts]) => ({ appId, ...counts }));
    }

    // ★ Merge rating counts into apps
    const appsWithCounts = appsWithoutCounts.map(app => {
        const counts = ratingCounts.find(rc => rc.appId === app.id);
        return {
            ...app,
            likesCount: counts?.likes ?? 0,
            dislikesCount: counts?.dislikes ?? 0,
        } as AppWithIncludedDataAndCounts; // Cast to the extended type
    });

    // Prisma エンティティを DTO にマッピング
    // ★ Use appsWithCounts for mapping
    const appDtos = appsWithCounts.map(app => AppDto.fromEntity(app)); 

    return new AppListResponseDto(appDtos, total);
  }

  async findOne(appId: number, userId?: number): Promise<AppDetailDto> {
    // Include 句を動的に構築 (ユーザー固有情報のみ)
    const includeClause: Prisma.AppInclude = {
      category: true,
      tags: { select: { id: true, name: true } },
      subImages: { select: { id: true, imageUrl: true } },
      creator: { // Creator情報を含める
        select: { 
          id: true, 
          name: true, 
          avatarUrl: true 
        } 
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
        }
      })
    };

    // アプリ基本情報とユーザー固有情報を取得
    const appPromise = this.prisma.app.findUniqueOrThrow({
      where: { id: appId, status: AppStatus.PUBLISHED },
      include: includeClause,
    });

    // 評価数を取得する Promise を作成
    const likesCountPromise = this.prisma.rating.count({
      where: { appId, type: RatingType.LIKE },
    });
    const dislikesCountPromise = this.prisma.rating.count({
      where: { appId, type: RatingType.DISLIKE },
    });

    // アプリ情報取得と評価数取得を並行実行
    const [app, likesCount, dislikesCount] = await Promise.all([
      appPromise,
      likesCountPromise,
      dislikesCountPromise,
    ]);

    // DTO を作成
    const dto = AppDetailDto.fromEntity(app as any);

    // ユーザー固有フラグを設定
    const includedBookmarks = (app as any).bookmarks;
    const includedRatings = (app as any).ratings;
    dto.isBookmarked = !!(includedBookmarks && includedBookmarks.length > 0);
    dto.isLiked = !!(includedRatings && includedRatings.length > 0 && includedRatings[0].type === RatingType.LIKE);
    dto.isDisliked = !!(includedRatings && includedRatings.length > 0 && includedRatings[0].type === RatingType.DISLIKE);

    // 評価数を設定
    dto.likesCount = likesCount;
    dto.dislikesCount = dislikesCount;

    return dto;
  }

  async useApp(appId: number, userId: number): Promise<void> {
    // アプリとユーザー情報（プランを含む）を一度に取得
    const app = await this.prisma.app.findUnique({
      where: { id: appId, status: AppStatus.PUBLISHED },
      select: { 
        id: true, // id は update で必要
        isSubscriptionLimited: true 
      },
    });

    if (!app) {
      throw new NotFoundException(`App with ID ${appId} not found or not published.`);
    }

    // サブスクリプション限定の場合、ユーザーのプランを確認
    if (app.isSubscriptionLimited) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { planName: true },
      });

      // ユーザーが見つからない、またはプランが 'free' の場合
      if (!user || user.planName === 'free') {
        throw new ForbiddenException('This app requires a paid subscription.');
      }
    }

    // 利用回数をインクリメント
    await this.prisma.app.update({
      where: { id: appId },
      data: { usageCount: { increment: 1 } },
    });
  }

  async findRecommended(
    currentAppId: number,
    query: GetRecommendedAppsQueryDto,
  ): Promise<AppListResponseDto> {
    const { page, limit: originalLimit, categoryId, tagIds } = query;
    // ★ Fetch more items initially for better randomness, e.g., 3 times the limit or max 50
    const fetchLimit = Math.min(originalLimit * 3, 50); 
    // Pagination needs adjustment if we fetch more. For simplicity, we fetch from the start for random.
    // If true pagination on random results is needed, it becomes more complex.
    // const skip = (page - 1) * originalLimit; // This skip won't work directly with shuffle

    // Build the OR condition for categories and tags
    const orConditions: Prisma.AppWhereInput[] = [];
    if (categoryId) {
      orConditions.push({ categoryId: categoryId });
    }
    if (tagIds && tagIds.length > 0) {
      orConditions.push({ tags: { some: { id: { in: tagIds } } } });
    }

    const where: Prisma.AppWhereInput = {
      status: AppStatus.PUBLISHED,
      id: { not: currentAppId }, // Exclude the current app
      ...(orConditions.length > 0 && { OR: orConditions }),
    };

    // ★ Remove explicit orderBy for default/undefined order before shuffling
    // const orderBy: Prisma.AppOrderByWithRelationInput = {
    //   usageCount: 'desc',
    // };

    // Fetch recommended apps (more than needed) and total count
    const [potentialApps, total] = await this.prisma.$transaction([
      this.prisma.app.findMany({
        where,
        // orderBy: orderBy, // Remove orderBy
        // skip: 0, // Fetch from start for shuffle
        take: fetchLimit, // Fetch more items
        include: { 
          // ★ Add category include
          category: {
            select: { 
              id: true,
              name: true
            }
          },
          creator: { 
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            }
          }
         } 
      }),
      this.prisma.app.count({ where }), // Total count remains the same
    ]);

    // ★ Shuffle the potential apps
    const shuffledApps = shuffleArray(potentialApps);

    // ★ Take the required number of apps for the current page
    // Simple approach: always take the first 'originalLimit' from the shuffled list.
    // Note: This doesn't provide true pagination over the random set.
    // Recalculating skip for the *shuffled* array based on page number:
    const skipForShuffled = (page - 1) * originalLimit;
    const paginatedApps = shuffledApps.slice(skipForShuffled, skipForShuffled + originalLimit);

    // Map to DTOs
    const appDtos = paginatedApps.map(app => AppDto.fromEntity(app as any));

    // Return the paginated (randomized) list and the *total* count of matching apps
    return new AppListResponseDto(appDtos, total);
  }

  // Add other methods like findOne(id) etc. if needed later
} 
