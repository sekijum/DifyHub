import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { Notification, NotificationLevel, Prisma } from '@prisma/client';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

// ページネーション結果型
export interface PaginatedNotificationsResult {
  data: Notification[];
  total: number;
}

@Injectable()
export class AdminNotificationsService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  /**
   * お知らせ一覧を取得
   */
  async findNotifications(
    query?: GetNotificationsQueryDto,
  ): Promise<PaginatedNotificationsResult> {
    // クエリが未定義の場合は空オブジェクトを使用
    const safeQuery = query || {};
    
    // デフォルト値を適用
    const page = safeQuery.page ?? 1;
    const limit = safeQuery.limit ?? 10;
    const search = safeQuery.search;
    const level = safeQuery.level;
    const isVisibleOnTop = safeQuery.isVisibleOnTop;
    const sortBy = safeQuery.sortBy ?? 'startAt';
    const sortOrder = safeQuery.sortOrder ?? 'desc';
    
    const skip = (page - 1) * limit;

    // where条件の構築
    const where: Prisma.NotificationWhereInput = {};

    // レベルによるフィルター
    if (level) {
      where.level = level;
    }

    // トップ表示フラグによるフィルター
    if (isVisibleOnTop !== undefined) {
      where.isVisibleOnTop = isVisibleOnTop;
    }

    // 現在アクティブなお知らせのみ表示
    if (safeQuery.isActive) {
      const now = new Date();
      where.AND = [
        { startAt: { lte: now } },
        {
          OR: [
            { endAt: { gte: now } },
            { endAt: null }
          ]
        }
      ];
    }

    // 日付範囲によるフィルター
    if (safeQuery.activeAfter) {
      where.startAt = where.startAt || {};
      (where.startAt as any).gte = new Date(safeQuery.activeAfter);
    }

    if (safeQuery.activeBefore) {
      where.endAt = where.endAt || {};
      (where.endAt as any).lte = new Date(safeQuery.activeBefore);
    }

    // 検索条件（タイトル、内容）
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // ソート条件の構築
    const orderBy: Prisma.NotificationOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    try {
      // データの取得と総件数のカウント
      const [notifications, total] = await this.prisma.$transaction([
        this.prisma.notification.findMany({
          where,
          skip,
          take: limit,
          orderBy,
        }),
        this.prisma.notification.count({ where }),
      ]);

      return {
        data: notifications,
        total,
      };
    } catch (error) {
      console.error('Error in findNotifications:', error);
      return {
        data: [],
        total: 0,
      };
    }
  }

  /**
   * お知らせ詳細を取得
   */
  async findNotificationById(id: number): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`お知らせ ID ${id} が見つかりません`);
    }

    return notification;
  }

  /**
   * お知らせを作成
   */
  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const { title, content, level, startAt, endAt, isVisibleOnTop } = dto;

    const startAtDate = new Date(startAt);
    const endAtDate = endAt ? new Date(endAt) : null;
    const now = new Date();
    now.setHours(0, 0, 0, 0); // 今日の0時0分

    // 日付検証: 開始日が今日より前の場合はエラー
    if (startAtDate < now) {
      throw new BadRequestException('開始日は今日以降の日付を指定してください');
    }

    // 日付検証: 終了日が今日より前の場合はエラー
    if (endAtDate && endAtDate < now) {
      throw new BadRequestException('終了日は今日以降の日付を指定してください');
    }

    // 日付検証: 開始日が終了日より後の場合はエラー
    if (endAtDate && startAtDate > endAtDate) {
      throw new BadRequestException('開始日は終了日より前の日付を指定してください');
    }

    try {
      return await this.prisma.notification.create({
        data: {
          title,
          content,
          level: level || NotificationLevel.INFO,
          startAt: startAtDate,
          endAt: endAtDate,
          isVisibleOnTop: isVisibleOnTop ?? false,
        },
      });
    } catch (error) {
      console.error('Error in createNotification:', error);
      throw new BadRequestException('お知らせの作成に失敗しました');
    }
  }

  /**
   * お知らせを更新
   */
  async updateNotification(
    id: number,
    dto: UpdateNotificationDto,
  ): Promise<Notification> {
    // お知らせの存在確認
    const existingNotification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      throw new NotFoundException(`お知らせ ID ${id} が見つかりません`);
    }

    // 日付変換と検証
    let startAtDate = existingNotification.startAt;
    let endAtDate = existingNotification.endAt;
    const now = new Date();
    now.setHours(0, 0, 0, 0); // 今日の0時0分

    if (dto.startAt) {
      startAtDate = new Date(dto.startAt);
      
      // 新しい開始日が元の開始日と異なり、今日より前の場合はエラー
      // 元の開始日が今日より前の場合は、その値を維持することを許可
      if (startAtDate.getTime() !== existingNotification.startAt.getTime() && startAtDate < now) {
        throw new BadRequestException('開始日は今日以降の日付を指定してください');
      }
    }

    if (dto.endAt) {
      endAtDate = new Date(dto.endAt);
      
      // 終了日が今日より前の場合はエラー
      if (endAtDate < now) {
        throw new BadRequestException('終了日は今日以降の日付を指定してください');
      }
    } else if (dto.endAt === '') {
      // 空文字列が来た場合はnullにする（終了日時の削除）
      endAtDate = null;
    }

    // 開始日が終了日より後の場合はエラー
    if (endAtDate && startAtDate > endAtDate) {
      throw new BadRequestException('開始日は終了日より前の日付を指定してください');
    }

    try {
      return await this.prisma.notification.update({
        where: { id },
        data: {
          title: dto.title,
          content: dto.content,
          level: dto.level,
          startAt: dto.startAt ? startAtDate : undefined,
          endAt: dto.endAt !== undefined ? endAtDate : undefined,
          isVisibleOnTop: dto.isVisibleOnTop,
        },
      });
    } catch (error) {
      console.error('Error in updateNotification:', error);
      throw new BadRequestException('お知らせの更新に失敗しました');
    }
  }

  /**
   * お知らせを削除
   */
  async deleteNotification(id: number): Promise<void> {
    // お知らせの存在確認
    const existingNotification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      throw new NotFoundException(`お知らせ ID ${id} が見つかりません`);
    }

    try {
      await this.prisma.notification.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      throw new BadRequestException('お知らせの削除に失敗しました');
    }
  }
} 
