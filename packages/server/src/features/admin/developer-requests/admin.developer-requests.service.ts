import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { prisma } from "@/core/database/prisma.client";
import { DeveloperRequestStatus, Prisma, Role } from "@prisma/client";
import {
  FindDeveloperRequestListQueryDto,
  UpdateDeveloperRequestStatusDto,
} from "./dto";
import { MailerService } from "@/core/mailer/mailer.service";
import {
  createPaginatedResponse,
  getPaginationParams,
} from "@/core/utils/pagination.util";

@Injectable()
export class AdminDeveloperRequestsService {
  private readonly logger = new Logger(AdminDeveloperRequestsService.name);

  constructor(private readonly mailerService: MailerService) {}

  /**
   * 開発者申請一覧を取得
   */
  async findDeveloperRequestList(query?: FindDeveloperRequestListQueryDto) {
    try {
      // ページネーションパラメータを取得
      const pagination = getPaginationParams(query);

      // where条件の構築
      const where: Prisma.DeveloperRequestWhereInput = {};

      // ステータスによるフィルター
      if (query.status) {
        where.status = query.status;
      }

      // 検索条件（ユーザー名、メールアドレス）
      if (pagination.search) {
        where.OR = [
          {
            user: {
              name: {
                contains: pagination.search,
                mode: "insensitive",
              },
            },
          },
          {
            user: {
              email: {
                contains: pagination.search,
                mode: "insensitive",
              },
            },
          },
        ];
      }

      // データの取得と総件数のカウント
      const [requests, total] = await prisma.$transaction([
        prisma.developerRequest.findMany({
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
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { [pagination.sortBy]: pagination.sortOrder },
        }),
        prisma.developerRequest.count({ where }),
      ]);

      return createPaginatedResponse(
        requests,
        total,
        pagination.page,
        pagination.limit,
      );
    } catch (error) {
      this.logger.error(
        `開発者申請一覧取得エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException(
        "開発者申請一覧の取得に失敗しました",
      );
    }
  }

  /**
   * 開発者申請詳細を取得
   */
  async findDeveloperRequestById(id: number) {
    try {
      const request = await prisma.developerRequest.findUniqueOrThrow({
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

      return request;
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`開発者申請 ID ${id} が見つかりません`);
      }

      this.logger.error(
        `開発者申請詳細取得エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException(
        "開発者申請詳細の取得に失敗しました",
      );
    }
  }

  /**
   * 開発者申請のステータスを更新
   */
  async updateDeveloperRequestStatus(
    id: number,
    dto: UpdateDeveloperRequestStatusDto,
  ) {
    try {
      // 申請の存在確認
      const existingRequest = await prisma.developerRequest.findUniqueOrThrow({
        where: { id },
        include: {
          user: true,
        },
      });

      // すでに処理済みの場合はエラー
      if (existingRequest.status !== DeveloperRequestStatus.PENDING) {
        throw new BadRequestException(
          `この申請はすでに ${existingRequest.status} 状態です`,
        );
      }

      if (dto.status === DeveloperRequestStatus.APPROVED) {
        // 承認の場合: 申請ステータスを更新 + ユーザーロールをDEVELOPERに変更
        await prisma.$transaction([
          // 申請ステータスを更新
          prisma.developerRequest.update({
            where: { id },
            data: {
              status: dto.status,
              resultReason:
                dto.resultReason ||
                "開発者としての十分な実績を確認できました。",
            },
          }),
          // ユーザーロールをDEVELOPERに変更
          prisma.user.update({
            where: { id: existingRequest.userId },
            data: {
              role: Role.DEVELOPER,
              // 開発者名をユーザー名で初期化
              developerName: existingRequest.user.name,
            },
          }),
        ]);

        // 承認メール送信
        try {
          await this.mailerService.sendDeveloperRequestApprovedEmail(
            {
              email: existingRequest.user.email,
              name: existingRequest.user.name,
            },
            dto.resultReason || "開発者としての十分な実績を確認できました。",
          );
        } catch (error) {
          this.logger.error(
            `承認メール送信エラー: ${error.message}`,
            error.stack,
            this.constructor.name,
          );
          // メール送信失敗は全体の処理を失敗させない
        }
      } else if (dto.status === DeveloperRequestStatus.REJECTED) {
        // 却下の場合: 申請ステータスのみ更新
        await prisma.developerRequest.update({
          where: { id },
          data: {
            status: dto.status,
            resultReason:
              dto.resultReason ||
              "申請内容が当サービスの基準を満たしていませんでした。",
          },
        });

        // 却下メール送信
        try {
          await this.mailerService.sendDeveloperRequestRejectedEmail(
            {
              email: existingRequest.user.email,
              name: existingRequest.user.name,
            },
            dto.resultReason ||
              "申請内容が当サービスの基準を満たしていませんでした。",
          );
        } catch (error) {
          this.logger.error(
            `却下メール送信エラー: ${error.message}`,
            error.stack,
            this.constructor.name,
          );
          // メール送信失敗は全体の処理を失敗させない
        }
      } else {
        throw new BadRequestException("有効なステータスではありません");
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error.code === "P2025") {
        throw new NotFoundException(`開発者申請 ID ${id} が見つかりません`);
      }

      this.logger.error(
        `開発者申請ステータス更新エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException(
        "開発者申請のステータス更新に失敗しました",
      );
    }
  }
}
