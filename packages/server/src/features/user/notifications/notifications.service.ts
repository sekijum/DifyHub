import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { prisma } from "@/core/database/prisma.client";
import { Prisma } from "@prisma/client";
import { FindNotificationListQueryDto } from "./dto";
import { logger } from "@/core/utils";
import {
  createPaginatedResponse,
  getPaginationParams,
} from "@/core/utils/pagination.util";
import { dayjs } from "@/core/utils";

@Injectable()
export class NotificationsService {
  // 有効期間フィルタリングのための共通条件
  private get baseWhereCondition(): Prisma.NotificationWhereInput {
    const now = dayjs().toDate();
    return {
      startAt: { lte: now }, // 開始日時が現在時刻以前
      OR: [
        { endAt: null }, // 終了日時が設定されていない
        { endAt: { gte: now } }, // または終了日時が現在時刻以降
      ],
    };
  }

  /**
   * 有効なお知らせをページネーションで取得
   */
  async findNotificationList(query?: FindNotificationListQueryDto) {
    try {
      const { skip, take, page, limit } = getPaginationParams(query);
      const where = this.baseWhereCondition;

      const orderBy: Prisma.NotificationOrderByWithRelationInput = {
        startAt: "desc", // 新しい順
      };

      // お知らせリストと総件数を並行取得
      const [data, total] = await prisma.$transaction([
        prisma.notification.findMany({
          where,
          orderBy,
          skip,
          take,
        }),
        prisma.notification.count({ where }), // 総件数も同じ条件でカウント
      ]);

      return createPaginatedResponse(data, total, page, limit);
    } catch (error) {
      logger.error(`お知らせ一覧取得エラー: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(
        "お知らせ一覧の取得に失敗しました",
      );
    }
  }

  /**
   * トップページ表示用の有効なお知らせを取得
   */
  async findTopNotificationList() {
    try {
      const where: Prisma.NotificationWhereInput = {
        ...this.baseWhereCondition, // 有効期間の条件
        isVisibleOnTop: true, // トップページ表示フラグ
      };

      const orderBy: Prisma.NotificationOrderByWithRelationInput = {
        startAt: "desc", // 新しい順
      };

      return await prisma.notification.findMany({
        where,
        orderBy,
      });
    } catch (error) {
      logger.error(`トップページお知らせ取得エラー: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(
        "トップページお知らせの取得に失敗しました",
      );
    }
  }
}
