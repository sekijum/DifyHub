import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { prisma } from "@/core/database/prisma.client";
import { AppStatus } from "@prisma/client";
import { logger } from "@/core/utils";

@Injectable()
export class TagsService {
  /**
   * 公開されているアプリに関連付けが多い順に上位5件のタグを取得します。
   */
  async findPopular() {
    try {
      const tags = await prisma.tag.findMany({
        where: {
          // 公開されているアプリが少なくとも1つ紐づいているタグのみを対象とする
          apps: {
            some: { status: AppStatus.PUBLISHED },
          },
        },
        take: 5,
        include: {
          _count: {
            select: {
              // 並び替えのために公開アプリ数をカウント
              apps: { where: { status: AppStatus.PUBLISHED } },
            },
          },
        },
        orderBy: {
          // 公開アプリ数で降順ソート
          apps: {
            _count: "desc",
          },
        },
      });

      // DTOを使わず、必要なデータ形式に変換
      return tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        appCount: tag._count?.apps || 0,
      }));
    } catch (error) {
      logger.error(`人気タグ取得エラー: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException("人気タグの取得に失敗しました");
    }
  }

  /**
   * すべてのタグを名前順で取得します。
   * オプションで公開アプリ数をカウントします。
   */
  async findTagList() {
    try {
      const tags = await prisma.tag.findMany({
        include: {
          _count: {
            select: {
              apps: { where: { status: AppStatus.PUBLISHED } },
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      // DTOを使わず、必要なデータ形式に変換
      return tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        appCount: tag._count?.apps || 0,
      }));
    } catch (error) {
      logger.error(`タグ一覧取得エラー: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException("タグ一覧の取得に失敗しました");
    }
  }
}
