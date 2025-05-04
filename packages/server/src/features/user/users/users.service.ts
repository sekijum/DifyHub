import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException, Inject } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, Role, Prisma, App, RatingType } from '@prisma/client';

// --- クエリパラメータを扱う DTO (仮定義 - 別途 dto/find-user-apps-query.dto.ts などで作成推奨) ---
// import { FindUserAppsQueryDto } from './dto/find-user-apps-query.dto';
interface FindUserAppsQueryDto {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'usageCount' | 'name'; // ソート可能なフィールド
  sortOrder?: 'asc' | 'desc';
  appName?: string; // アプリ名検索用
}
// ------------------------------------------------------------------------------------

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async findOne(id: number, queryDto: FindUserAppsQueryDto = {}) {
    // 1. ユーザー情報を取得
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        planName: true,
        bio: true,
      },
    }).catch(() => {
        throw new NotFoundException(`User with ID ${id} not found.`);
    });

    // 2. アプリ取得のためのパラメータ準備
    const {
      page = 1,
      limit = 12, // デフォルトの表示件数
      sortBy = 'usageCount', // デフォルトのソートキー
      sortOrder = 'desc', // デフォルトのソート順
      appName,
    } = queryDto;

    // page は 1 以上、 limit は 1 以上にする (バリデーションはDTOで行うのが望ましい)
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const skip = (safePage - 1) * safeLimit;
    const take = safeLimit;

    // 3. アプリ検索条件 (Where句) の構築
    const where: Prisma.AppWhereInput = {
      creatorId: id,
      status: 'PUBLISHED', // 公開中のアプリのみを対象とする (必要に応じて変更)
    };
    if (appName) {
      where.name = {
        contains: appName,
        mode: 'insensitive', // 大文字小文字を区別しない
      };
    }

    // 4. アプリのソート条件 (OrderBy句) の構築
    const orderBy: Prisma.AppOrderByWithRelationInput = {};
    // sortBy が許可されたキーかチェック (より厳密にするなら Enum などを使う)
    const allowedSortBy: ('createdAt' | 'usageCount' | 'name')[] = ['createdAt', 'usageCount', 'name'];
    if (allowedSortBy.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc'; // sortOrder も検証
    } else {
      orderBy.usageCount = 'desc'; // デフォルト
    }

    // 5. アプリリストと総数を並行して取得 (評価数は後で取得)
    const [appsWithoutCounts, totalApps] = await this.prisma.$transaction([
      this.prisma.app.findMany({
        where,
        orderBy,
        skip,
        take,
        select: { // Select necessary fields, ratings counts will be added later
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
      this.prisma.app.count({ where }),
    ]);

    // 6. 取得したアプリの評価数を取得 (apps.service.ts の findAll を参考)
    const appIds = appsWithoutCounts.map(app => app.id);
    let ratingCountsMap = new Map<number, { likes: number; dislikes: number }>();

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

        // 集計結果をMapに格納
        counts.forEach(item => {
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
    const mappedApps = appsWithoutCounts.map(app => {
      const counts = ratingCountsMap.get(app.id) || { likes: 0, dislikes: 0 };
      return {
          ...app,
          likesCount: counts.likes,
          dislikesCount: counts.dislikes,
          // creatorName, creatorAvatarUrl は userProfile から取得 or フロントで付与
      };
    });

    // 8. 結果を結合して返す
    return {
      ...user, // ユーザー情報
      apps: { // アプリ情報
        data: mappedApps, // マッピング後のアプリリスト
        total: totalApps, // 条件に一致する総アプリ数
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(totalApps / safeLimit),
      },
    };
  }

  // --- 他のメソッド (findByEmail, findById, create) --- (変更なし)
}
