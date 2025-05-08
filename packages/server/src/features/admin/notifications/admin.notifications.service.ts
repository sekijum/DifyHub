import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { prisma } from "@/core/database/prisma.client";
import { NotificationLevel, Prisma } from "@prisma/client";
import {
  FindNotificationListQueryDto,
  CreateNotificationDto,
  UpdateNotificationDto,
} from "./dto";
import { dayjs } from "@/core/utils/dayjs.util";
import {
  createPaginatedResponse,
  getPaginationParams,
} from "@/core/utils/pagination.util";

@Injectable()
export class AdminNotificationsService {
  private readonly logger = new Logger(AdminNotificationsService.name);

  /**
   * お知らせ一覧を取得
   */
  async findNotificationList(query?: FindNotificationListQueryDto) {
    try {
      // ページネーションパラメータを取得
      const pagination = getPaginationParams(query);

      // where条件の構築
      const where: Prisma.NotificationWhereInput = {};

      if (pagination.search) {
        where.OR = [
          {
            title: {
              contains: pagination.search,
              mode: "insensitive",
            },
          },
          {
            content: {
              contains: pagination.search,
              mode: "insensitive",
            },
          },
        ];
      }

      // データの取得と総件数のカウント
      const [notifications, total] = await prisma.$transaction([
        prisma.notification.findMany({
          where,
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { [pagination.sortBy]: pagination.sortOrder },
        }),
        prisma.notification.count({ where }),
      ]);

      return createPaginatedResponse(
        notifications,
        total,
        pagination.page,
        pagination.limit,
      );
    } catch (error) {
      this.logger.error(
        `お知らせ一覧取得エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException(
        "お知らせ一覧の取得に失敗しました",
      );
    }
  }

  /**
   * お知らせ詳細を取得
   */
  async findNotificationById(id: number) {
    try {
      const notification = await prisma.notification.findUniqueOrThrow({
        where: { id },
      });

      return notification;
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`お知らせ ID ${id} が見つかりません`);
      }

      this.logger.error(
        `お知らせ詳細取得エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException(
        "お知らせ詳細の取得に失敗しました",
      );
    }
  }

  /**
   * お知らせを作成
   */
  async createNotification(dto: CreateNotificationDto) {
    try {
      const startAtDate = dayjs(dto.startAt);
      const endAtDate = dto.endAt ? dayjs(dto.endAt) : null;
      const today = dayjs().startOf("day");

      // 日付検証: 開始日が今日より前の場合はエラー
      if (startAtDate.isBefore(today)) {
        throw new BadRequestException(
          "開始日は今日以降の日付を指定してください",
        );
      }

      // 日付検証: 終了日が今日より前の場合はエラー
      if (endAtDate && endAtDate.isBefore(today)) {
        throw new BadRequestException(
          "終了日は今日以降の日付を指定してください",
        );
      }

      // 日付検証: 開始日が終了日より後の場合はエラー
      if (endAtDate && startAtDate.isAfter(endAtDate)) {
        throw new BadRequestException(
          "開始日は終了日より前の日付を指定してください",
        );
      }

      await prisma.notification.create({
        data: {
          title: dto.title,
          content: dto.content,
          level: dto.level || NotificationLevel.INFO,
          startAt: startAtDate.toDate(),
          endAt: endAtDate ? endAtDate.toDate() : null,
          isVisibleOnTop: dto.isVisibleOnTop ?? false,
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `お知らせ作成エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException("お知らせの作成に失敗しました");
    }
  }

  /**
   * お知らせを更新
   */
  async updateNotification(id: number, dto: UpdateNotificationDto) {
    try {
      // お知らせの存在確認
      const existingNotification = await prisma.notification.findUniqueOrThrow({
        where: { id },
      });

      // 日付変換と検証
      let startAtDate = dayjs(existingNotification.startAt);
      let endAtDate = existingNotification.endAt
        ? dayjs(existingNotification.endAt)
        : null;
      const today = dayjs().startOf("day");

      if (dto.startAt) {
        const newStartAtDate = dayjs(dto.startAt);

        // 新しい開始日が元の開始日と異なり、今日より前の場合はエラー
        // 元の開始日が今日より前の場合は、その値を維持することを許可
        if (
          !startAtDate.isSame(newStartAtDate) &&
          newStartAtDate.isBefore(today)
        ) {
          throw new BadRequestException(
            "開始日は今日以降の日付を指定してください",
          );
        }

        startAtDate = newStartAtDate;
      }

      if (dto.endAt) {
        endAtDate = dayjs(dto.endAt);

        // 終了日が今日より前の場合はエラー
        if (endAtDate.isBefore(today)) {
          throw new BadRequestException(
            "終了日は今日以降の日付を指定してください",
          );
        }
      } else if (dto.endAt === "") {
        // 空文字列が来た場合はnullにする（終了日時の削除）
        endAtDate = null;
      }

      // 開始日が終了日より後の場合はエラー
      if (endAtDate && startAtDate.isAfter(endAtDate)) {
        throw new BadRequestException(
          "開始日は終了日より前の日付を指定してください",
        );
      }

      await prisma.notification.update({
        where: { id },
        data: {
          title: dto.title,
          content: dto.content,
          level: dto.level,
          startAt: dto.startAt ? startAtDate.toDate() : undefined,
          endAt:
            dto.endAt !== undefined
              ? endAtDate
                ? endAtDate.toDate()
                : null
              : undefined,
          isVisibleOnTop: dto.isVisibleOnTop,
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error.code === "P2025") {
        throw new NotFoundException(`お知らせ ID ${id} が見つかりません`);
      }

      this.logger.error(
        `お知らせ更新エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException("お知らせの更新に失敗しました");
    }
  }

  /**
   * お知らせを削除
   */
  async deleteNotification(id: number) {
    try {
      // お知らせの存在確認と削除を一度に実行
      await prisma.notification.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`お知らせ ID ${id} が見つかりません`);
      }

      this.logger.error(
        `お知らせ削除エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException("お知らせの削除に失敗しました");
    }
  }
}
