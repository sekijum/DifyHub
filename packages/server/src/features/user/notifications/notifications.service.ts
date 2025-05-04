import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { NotificationDto } from './dto/notification.dto';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { Prisma } from '@prisma/client';

// レスポンスの型を定義 (コントローラでも使うのでエクスポートしても良い)
interface NotificationListResponse {
    data: NotificationDto[];
    total: number;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // 有効期間フィルタリングのための共通条件
  private get baseWhereCondition(): Prisma.NotificationWhereInput {
    const now = new Date();
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
  async findAll(query: GetNotificationsQueryDto): Promise<NotificationListResponse> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const where = this.baseWhereCondition;

    const orderBy: Prisma.NotificationOrderByWithRelationInput = {
      startAt: 'desc', // 新しい順
    };

    // お知らせリストと総件数を並行取得
    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      this.prisma.notification.count({ where }), // 総件数も同じ条件でカウント
    ]);

    // DTOに変換
    const notificationDtos = notifications.map(NotificationDto.fromEntity);
    return { data: notificationDtos, total };
  }

  /**
   * トップページ表示用の有効なお知らせを取得
   */
  async findForTopPage(): Promise<NotificationDto[]> {
    const where: Prisma.NotificationWhereInput = {
      ...this.baseWhereCondition, // 有効期間の条件
      isVisibleOnTop: true,       // トップページ表示フラグ
    };

    const orderBy: Prisma.NotificationOrderByWithRelationInput = {
      createdAt: 'desc', // 新しい順
    };

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy,
      // take: 5, // 必要に応じて表示件数を制限
    });

    // DTOに変換
    return notifications.map(NotificationDto.fromEntity);
  }
} 
