import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { prisma } from "@/core/database/prisma.client";
import { AppStatus } from "@prisma/client";
import { logger } from "@/core/utils";

@Injectable()
export class CategoriesService {
  /**
   * すべてのカテゴリを取得します。
   * アプリ数の多い順にソートされます。
   */
  async findCategoryList() {
    try {
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: {
              apps: { where: { status: AppStatus.PUBLISHED } },
            },
          },
        },
        orderBy: {
          apps: {
            _count: "desc",
          },
        },
      });

      // DTOを使わず、直接必要なデータ形式に変換
      return categories.map((category) => ({
        id: category.id,
        name: category.name,
        appCount: category._count?.apps || 0,
      }));
    } catch (error) {
      logger.error(`カテゴリ一覧取得エラー: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(
        "カテゴリ一覧の取得に失敗しました",
      );
    }
  }
}
