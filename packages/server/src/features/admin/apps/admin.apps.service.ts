import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { prisma } from "@/core/database/prisma.client";
import { AppStatus, Prisma } from "@prisma/client";
import { FindAppListQueryDto, UpdateAppStatusDto } from "./dto";
import { MailerService } from "@/core/mailer/mailer.service";
import {
  createPaginatedResponse,
  getPaginationParams,
} from "@/core/utils/pagination.util";

@Injectable()
export class AdminAppsService {
  private readonly logger = new Logger(AdminAppsService.name);

  constructor(private readonly mailerService: MailerService) {}

  /**
   * アプリ一覧を取得
   */
  async findAppList(query?: FindAppListQueryDto) {
    try {
      const pagination = getPaginationParams(query);

      // where条件の構築
      const where: Prisma.AppWhereInput = {};

      if (query.status) {
        where.status = query.status;
      }

      if (query.categoryId) {
        where.categoryId = query.categoryId;
      }

      if (pagination.search) {
        where.OR = [
          { name: { contains: pagination.search, mode: "insensitive" } },
          { description: { contains: pagination.search, mode: "insensitive" } },
          {
            creator: {
              name: { contains: pagination.search, mode: "insensitive" },
            },
          },
        ];
      }

      const [apps, total] = await prisma.$transaction([
        prisma.app.findMany({
          where,
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                ratings: true,
                bookmarks: true,
              },
            },
          },
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { [pagination.sortBy]: pagination.sortOrder },
        }),
        prisma.app.count({ where }),
      ]);

      return createPaginatedResponse(
        apps,
        total,
        pagination.page,
        pagination.limit,
      );
    } catch (error) {
      this.logger.error(
        `アプリ一覧取得エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException("アプリ一覧の取得に失敗しました");
    }
  }

  /**
   * アプリ詳細を取得
   */
  async findAppById(id: number) {
    try {
      const app = await prisma.app.findUniqueOrThrow({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: true,
          subImages: {
            orderBy: {
              order: "asc",
            },
          },
          _count: {
            select: {
              ratings: true,
              bookmarks: true,
            },
          },
        },
      });

      return app;
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`アプリ ID ${id} が見つかりません`);
      }

      this.logger.error(
        `アプリ詳細取得エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException("アプリ詳細の取得に失敗しました");
    }
  }

  /**
   * アプリのステータスを更新
   */
  async updateAppStatus(id: number, dto: UpdateAppStatusDto) {
    try {
      // アプリの存在確認
      const existingApp = await prisma.app.findUniqueOrThrow({
        where: { id },
        include: {
          creator: true,
        },
      });

      this.validateStatusChange(existingApp.status, dto.status);

      const updatedApp = await prisma.app.update({
        where: { id },
        data: { status: dto.status },
      });

      await this.sendStatusChangeNotification(
        existingApp.creator.email,
        existingApp.creator.name,
        existingApp.name,
        dto.status,
        dto.resultReason,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error.code === "P2025") {
        throw new NotFoundException(`アプリ ID ${id} が見つかりません`);
      }

      this.logger.error(
        `アプリステータス更新エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException(
        "アプリのステータス更新に失敗しました",
      );
    }
  }

  private async sendStatusChangeNotification(
    email: string,
    creatorName: string,
    appName: string,
    status: AppStatus,
    reason?: string,
  ) {
    try {
      const recipient = { email, name: creatorName };

      switch (status) {
        case AppStatus.PUBLISHED:
          await this.mailerService.sendAppPublishedEmail(recipient, appName);
          break;
        case AppStatus.PRIVATE:
          await this.mailerService.sendAppPrivateEmail(
            recipient,
            appName,
            reason,
          );
          break;
        case AppStatus.ARCHIVED:
          await this.mailerService.sendAppArchivedEmail(recipient, appName);
          break;
        case AppStatus.SUSPENDED:
          await this.mailerService.sendAppSuspendedEmail(
            recipient,
            appName,
            reason,
          );
          break;
      }
    } catch (error) {
      this.logger.error(
        `アプリステータス変更通知メール送信エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      // メール送信失敗は全体の処理を失敗させない
    }
  }

  /**
   * ステータス変更の検証
   * 無効なステータス変更の組み合わせをチェック
   */
  private validateStatusChange(currentStatus: AppStatus, newStatus: AppStatus) {
    if (currentStatus === newStatus) {
      return;
    }

    const invalidTransitions: Record<AppStatus, AppStatus[]> = {
      [AppStatus.DRAFT]: [],
      [AppStatus.PUBLISHED]: [AppStatus.DRAFT],
      [AppStatus.ARCHIVED]: [AppStatus.PUBLISHED],
      [AppStatus.PRIVATE]: [AppStatus.PUBLISHED],
      [AppStatus.SUSPENDED]: [AppStatus.PUBLISHED],
    };

    if (invalidTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `${currentStatus}から${newStatus}へのステータス変更は許可されていません`,
      );
    }
  }
}
