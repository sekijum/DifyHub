import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { DeveloperRequest, DeveloperRequestStatus, Prisma, Role } from '@prisma/client';
import { GetDeveloperRequestsQueryDto } from './dto/get-developer-requests-query.dto';
import { UpdateDeveloperRequestStatusDto } from './dto/update-developer-request-status.dto';
import { MailerService } from '@/core/mailer/mailer.service';

// 申請データとユーザー情報を結合した型
export interface DeveloperRequestWithUser extends DeveloperRequest {
  user: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

// ページネーション結果型
export interface PaginatedDeveloperRequestsResult {
  data: DeveloperRequestWithUser[];
  total: number;
}

@Injectable()
export class AdminDeveloperRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService
  ) {}

  /**
   * 開発者申請一覧を取得
   */
  async findDeveloperRequests(
    query?: GetDeveloperRequestsQueryDto,
  ): Promise<PaginatedDeveloperRequestsResult> {
    // クエリが未定義の場合は空オブジェクトを使用
    const safeQuery = query || {};
    
    // デフォルト値を適用
    const page = safeQuery.page ?? 1;
    const limit = safeQuery.limit ?? 10;
    const status = safeQuery.status;
    const search = safeQuery.search;
    const sortBy = safeQuery.sortBy ?? 'createdAt';
    const sortOrder = safeQuery.sortOrder ?? 'desc';
    
    const skip = (page - 1) * limit;

    // where条件の構築
    const where: Prisma.DeveloperRequestWhereInput = {};

    // ステータスによるフィルター
    if (status) {
      where.status = status;
    }

    // 検索条件（ユーザー名、メールアドレス）
    if (search) {
      where.OR = [
        {
          user: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    // ソート条件の構築
    const orderBy: Prisma.DeveloperRequestOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    try {
      // データの取得と総件数のカウント
      const [requests, total] = await this.prisma.$transaction([
        this.prisma.developerRequest.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy,
        }),
        this.prisma.developerRequest.count({ where }),
      ]);

      return {
        data: requests as DeveloperRequestWithUser[],
        total,
      };
    } catch (error) {
      console.error('Error in findDeveloperRequests:', error);
      return {
        data: [],
        total: 0,
      };
    }
  }

  /**
   * 開発者申請詳細を取得
   */
  async findDeveloperRequestById(id: number): Promise<DeveloperRequestWithUser> {
    const request = await this.prisma.developerRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`開発者申請 ID ${id} が見つかりません`);
    }

    return request as DeveloperRequestWithUser;
  }

  /**
   * 開発者申請のステータスを更新
   */
  async updateDeveloperRequestStatus(
    id: number,
    dto: UpdateDeveloperRequestStatusDto,
  ): Promise<DeveloperRequestWithUser> {
    const { status, resultReason } = dto;

    // 申請の存在確認
    const existingRequest = await this.prisma.developerRequest.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!existingRequest) {
      throw new NotFoundException(`開発者申請 ID ${id} が見つかりません`);
    }

    // すでに処理済みの場合はエラー
    if (existingRequest.status !== DeveloperRequestStatus.PENDING) {
      throw new BadRequestException(`この申請はすでに ${existingRequest.status} 状態です`);
    }

    // ステータス更新のトランザクション
    try {
      let updatedRequest;

      if (status === DeveloperRequestStatus.APPROVED) {
        // 承認の場合: 申請ステータスを更新 + ユーザーロールをDEVELOPERに変更
        const result = await this.prisma.$transaction([
          // 申請ステータスを更新
          this.prisma.developerRequest.update({
            where: { id },
            data: { 
              status,
              resultReason: resultReason || '開発者としての十分な実績を確認できました。' 
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          }),
          // ユーザーロールをDEVELOPERに変更
          this.prisma.user.update({
            where: { id: existingRequest.userId },
            data: {
              role: Role.DEVELOPER,
              // 開発者名をユーザー名で初期化
              developerName: existingRequest.user.name,
            },
          }),
        ]);

        updatedRequest = result[0];
        
        // 承認メール送信
        try {
          await this.mailerService.sendDeveloperRequestApprovedEmail({
            email: existingRequest.user.email,
            name: existingRequest.user.name
          }, resultReason || '開発者としての十分な実績を確認できました。');
        } catch (error) {
          console.error('承認メール送信に失敗しました', error);
          // メール送信失敗は全体の処理を失敗させない
        }
      } else if (status === DeveloperRequestStatus.REJECTED) {
        // 却下の場合: 申請ステータスのみ更新
        updatedRequest = await this.prisma.developerRequest.update({
          where: { id },
          data: { 
            status,
            resultReason: resultReason || '申請内容が当サービスの基準を満たしていませんでした。'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        });
        
        // 却下メール送信
        try {
          await this.mailerService.sendDeveloperRequestRejectedEmail(
            {
              email: existingRequest.user.email,
              name: existingRequest.user.name
            },
            resultReason || '申請内容が当サービスの基準を満たしていませんでした。'
          );
        } catch (error) {
          console.error('却下メール送信に失敗しました', error);
          // メール送信失敗は全体の処理を失敗させない
        }
      } else {
        throw new BadRequestException('有効なステータスではありません');
      }

      return updatedRequest as DeveloperRequestWithUser;
    } catch (error) {
      console.error('Error in updateDeveloperRequestStatus:', error);
      throw new BadRequestException('開発者申請のステータス更新に失敗しました');
    }
  }
} 
