import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { prisma } from "@/core/database/prisma.client";
import { Plan, Prisma } from "@prisma/client";
import { CreatePlanDto, UpdatePlanDto } from "./dto";
import { randomUUID } from "crypto";
import { square } from "@/core/square/square.client";
import { logger } from "@/core/utils";

@Injectable()
export class AdminPlansService {
  /**
   * プラン一覧を取得
   */
  async findPlanList() {
    const data = await prisma.plan.findMany({
      orderBy: { createdAt: "asc" },
    });

    // クライアント側が期待する形式に変換
    const planList = data.map((plan) => {
      return {
        ...plan,
        features: {
          additionalFeatures: Array.isArray(plan.features) ? plan.features : [],
        },
      };
    });

    return planList;
  }

  /**
   * プラン詳細を取得
   */
  async findPlanById(name: string) {
    const plan = await prisma.plan.findUniqueOrThrow({
      where: { name },
    });

    return {
      ...plan,
      features: {
        additionalFeatures: Array.isArray(plan.features) ? plan.features : [],
      },
    };
  }

  /**
   * Square用の一時IDを生成
   */
  private generateSquareTempId(name: string): string {
    return `#${name.replace(/\s+/g, "_")}_${Date.now()}`;
  }

  /**
   * プランを作成
   */
  async createPlan(dto: CreatePlanDto) {
    const existingPlan = await prisma.plan.findUnique({
      where: { name: dto.name },
    });

    if (existingPlan) {
      throw new ConflictException("プラン名が既に存在します。");
    }

    // Square APIの要件に合わせてIDを#で始まる一時IDに変更
    const tempSquareId = this.generateSquareTempId(dto.name);
    const squareCurrency = process.env.SQUARE_CURRENCY || "JPY";

    try {
      const response = await square.catalog.object.upsert({
        idempotencyKey: randomUUID(),
        object: {
          type: "SUBSCRIPTION_PLAN",
          id: tempSquareId,
          subscriptionPlanData: {
            name: dto.name,
            phases: [
              {
                cadence: dto.billingPeriod || ("MONTHLY" as any),
                recurringPriceMoney: {
                  amount: BigInt(dto.amount),
                  currency: squareCurrency as any,
                },
              },
            ],
          },
        },
      });

      const squareCatalogId = response.catalogObject.id;

      // DBにプランを作成
      const plan = await prisma.plan.create({
        data: {
          name: dto.name,
          amount: dto.amount,
          squareCatalogId: squareCatalogId,
          features: dto.features || [],
          status: dto.status,
          billingPeriod: "MONTHLY",
        },
      });

      return plan;
    } catch (error) {
      logger.error(`Square APIエラー: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException("プランの作成に失敗しました");
    }
  }

  /**
   * プランを更新
   */
  async updatePlan(name: string, dto: UpdatePlanDto) {
    // 対象プランの存在確認
    const existingPlan = await prisma.plan.findUniqueOrThrow({
      where: { name },
    });

    // Square IDが存在することを確認
    if (!existingPlan.squareCatalogId) {
      logger.error(`プラン「${name}」のSquare IDが存在しません`);
      throw new InternalServerErrorException("Square IDが見つかりません");
    }

    // 更新データの準備
    const updateData: Prisma.PlanUpdateInput = {
      ...dto,
      features: dto.features || existingPlan.features,
    };

    try {
      // Square情報を更新
      await square.catalog.object.upsert({
        idempotencyKey: randomUUID(),
        object: {
          type: "SUBSCRIPTION_PLAN",
          id: existingPlan.squareCatalogId,
          subscriptionPlanData: {
            name: dto.name || existingPlan.name,
            phases: [
              {
                cadence:
                  dto.billingPeriod ||
                  existingPlan.billingPeriod ||
                  ("MONTHLY" as any),
                recurringPriceMoney: {
                  amount: BigInt(dto.amount || existingPlan.amount),
                  currency: (process.env.SQUARE_CURRENCY || "JPY") as any,
                },
              },
            ],
          },
        },
      });

      // DBプランを更新
      const updatedPlan = await prisma.plan.update({
        where: { name },
        data: updateData,
      });

      return updatedPlan;
    } catch (error) {
      logger.error(`Square APIエラー: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(
        "プランのSquare情報の更新に失敗しました",
      );
    }
  }

  /**
   * プランを削除
   */
  async deletePlan(name: string) {
    // 対象プランの存在確認
    const existingPlan = await prisma.plan.findUniqueOrThrow({
      where: { name },
    });

    // このプランを使用中のユーザーがいるか確認
    const usersCount = await prisma.user.count({
      where: { subscription: { planName: name } },
    });

    if (usersCount > 0) {
      throw new ConflictException(
        `このプランは${usersCount}人のユーザーが利用中のため削除できません。`,
      );
    }

    try {
      // Square情報を削除
      await square.catalog.object.delete({
        objectId: existingPlan.squareCatalogId,
      });

      // DBから削除
      await prisma.plan.delete({
        where: { name },
      });
    } catch (error) {
      logger.error(`プラン削除エラー: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException("プランの削除に失敗しました");
    }
  }
}
