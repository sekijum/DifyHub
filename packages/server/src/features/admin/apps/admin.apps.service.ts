import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { App, AppStatus, Prisma } from '@prisma/client';
import { GetAppsQueryDto } from './dto/get-apps-query.dto';
import { UpdateAppStatusDto } from './dto/update-app-status.dto';
import { MailerService } from '@/core/mailer/mailer.service';

// アプリデータと作成者情報を結合した型
export interface AppWithCreator extends App {
  creator: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  category?: {
    id: number;
    name: string;
  } | null;
  _count?: {
    ratings: number;
    bookmarks: number;
  };
}

// ページネーション結果型
export interface PaginatedAppsResult {
  data: AppWithCreator[];
  total: number;
}

@Injectable()
export class AdminAppsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService
  ) {}

  /**
   * アプリ一覧を取得
   */
  async findApps(
    query?: GetAppsQueryDto,
  ): Promise<PaginatedAppsResult> {
    // クエリが未定義の場合は空オブジェクトを使用
    const safeQuery = query || {};
    
    // デフォルト値を適用
    const page = safeQuery.page ?? 1;
    const limit = safeQuery.limit ?? 10;
    const status = safeQuery.status;
    const search = safeQuery.search;
    const categoryId = safeQuery.categoryId;
    const sortBy = safeQuery.sortBy ?? 'createdAt';
    const sortOrder = safeQuery.sortOrder ?? 'desc';
    
    const skip = (page - 1) * limit;

    // where条件の構築
    const where: Prisma.AppWhereInput = {};

    // ステータスによるフィルター
    if (status) {
      where.status = status;
    }

    // カテゴリーによるフィルター
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 検索条件（アプリ名、説明、作成者名）
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          creator: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    // ソート条件の構築
    const orderBy: Prisma.AppOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    try {
      // データの取得と総件数のカウント
      const [apps, total] = await this.prisma.$transaction([
        this.prisma.app.findMany({
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
          skip,
          take: limit,
          orderBy,
        }),
        this.prisma.app.count({ where }),
      ]);

      return {
        data: apps as AppWithCreator[],
        total,
      };
    } catch (error) {
      console.error('Error in findApps:', error);
      return {
        data: [],
        total: 0,
      };
    }
  }

  /**
   * アプリ詳細を取得
   */
  async findAppById(id: number): Promise<AppWithCreator> {
    const app = await this.prisma.app.findUnique({
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
            order: 'asc',
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

    if (!app) {
      throw new NotFoundException(`アプリ ID ${id} が見つかりません`);
    }

    return app as AppWithCreator;
  }

  /**
   * アプリのステータスを更新
   */
  async updateAppStatus(
    id: number,
    dto: UpdateAppStatusDto,
  ): Promise<AppWithCreator> {
    const { status, resultReason } = dto;

    // アプリの存在確認
    const existingApp = await this.prisma.app.findUnique({
      where: { id },
      include: {
        creator: true,
      },
    });

    if (!existingApp) {
      throw new NotFoundException(`アプリ ID ${id} が見つかりません`);
    }

    // 有効なステータス変更かチェック
    this.validateStatusChange(existingApp.status, status);

    try {
      // アプリのステータスを更新
      const updatedApp = await this.prisma.app.update({
        where: { id },
        data: { 
          status,
        },
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
        },
      });
      
      // ステータス変更通知メールの送信（必要に応じて実装）
      if (status === AppStatus.PUBLISHED) {
        try {
          // アプリ公開通知メール
          await this.mailerService.sendAppPublishedEmail({
            email: existingApp.creator.email,
            name: existingApp.creator.name
          }, existingApp.name);
        } catch (error) {
          console.error('アプリ公開通知メール送信に失敗しました', error);
          // メール送信失敗は全体の処理を失敗させない
        }
      } else if (status === AppStatus.PRIVATE) {
        try {
          // アプリ非公開通知メール
          await this.mailerService.sendAppPrivateEmail({
            email: existingApp.creator.email,
            name: existingApp.creator.name
          }, existingApp.name, resultReason);
        } catch (error) {
          console.error('アプリ非公開通知メール送信に失敗しました', error);
          // メール送信失敗は全体の処理を失敗させない
        }
      } else if (status === AppStatus.ARCHIVED) {
        try {
          // アプリアーカイブ通知メール
          await this.mailerService.sendAppArchivedEmail({
            email: existingApp.creator.email,
            name: existingApp.creator.name
          }, existingApp.name);
        } catch (error) {
          console.error('アプリアーカイブ通知メール送信に失敗しました', error);
          // メール送信失敗は全体の処理を失敗させない
        }
      } else if (status === AppStatus.SUSPENDED) {
        try {
          // アプリ停止通知メール
          await this.mailerService.sendAppSuspendedEmail({
            email: existingApp.creator.email,
            name: existingApp.creator.name
          }, existingApp.name, resultReason);
        } catch (error) {
          console.error('アプリ停止通知メール送信に失敗しました', error);
          // メール送信失敗は全体の処理を失敗させない
        }
      }

      return updatedApp as AppWithCreator;
    } catch (error) {
      console.error('Error in updateAppStatus:', error);
      throw new BadRequestException('アプリのステータス更新に失敗しました');
    }
  }

  /**
   * ステータス変更の検証
   * 無効なステータス変更の組み合わせをチェック
   */
  private validateStatusChange(currentStatus: AppStatus, newStatus: AppStatus): void {
    // 同じステータスへの変更は許可
    if (currentStatus === newStatus) {
      return;
    }

    // 無効なステータス変更の組み合わせ
    const invalidTransitions: Record<AppStatus, AppStatus[]> = {
      [AppStatus.DRAFT]: [],  // ドラフトからはどのステータスへも変更可能
      [AppStatus.PUBLISHED]: [AppStatus.DRAFT], // 公開済みからドラフトへは戻せない
      [AppStatus.ARCHIVED]: [AppStatus.PUBLISHED], // アーカイブから直接公開へは変更不可
      [AppStatus.PRIVATE]: [AppStatus.PUBLISHED], // 非公開から直接公開へは変更不可
      [AppStatus.SUSPENDED]: [AppStatus.PUBLISHED], // 停止から直接公開へは変更不可
    };

    if (invalidTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(`${currentStatus}から${newStatus}へのステータス変更は許可されていません`);
    }
  }
} 
