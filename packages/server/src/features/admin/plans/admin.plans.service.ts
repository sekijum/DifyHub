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
import { payjp } from "@/core/payjp";
import { logger } from "@/core/utils";

@Injectable()
export class AdminPlansService {
  /**
   * プラン一覧を取得
   */
  async findPlanList() {
    try {
      // DBからプラン一覧を取得
      const dbPlanList = await prisma.plan.findMany({
        orderBy: { createdAt: "asc" },
      });

      // PAY.JPから最新のプラン情報を取得
      const payjpPlansResponse = await payjp.plans.list();
      const payjpPlans = payjpPlansResponse.data || [];

      // payjpPlanIdをキーにしたマップを作成
      const payjpPlansMap = new Map();
      payjpPlans.forEach(payjpPlan => {
        payjpPlansMap.set(payjpPlan.id, payjpPlan);
      });

      // DBのプラン情報とPAY.JPのプラン情報をマージ
      const planList = dbPlanList.map(plan => {
        const payjpPlan = payjpPlansMap.get(plan.payjpPlanId);
        
        // isDefaultプロパティを削除した新しいオブジェクトを作成
        const { isDefault, ...planWithoutIsDefault } = plan;
        
        return {
          ...planWithoutIsDefault,
          amount: payjpPlan?.amount || 0,
          interval: payjpPlan?.interval || "month",
          features: {
            additionalFeatures: Array.isArray(plan.features) ? plan.features : [],
          },
        };
      });

      return planList;
    } catch (error) {
      logger.error(`PAY.JP APIエラー: ${JSON.stringify(error)}`);
      
      // エラーが発生した場合はDBの情報のみを返却
      const dbPlans = await prisma.plan.findMany({
        orderBy: { createdAt: "asc" },
      });
      
      return dbPlans.map((plan) => {
        // isDefaultプロパティを削除
        const { isDefault, ...planWithoutIsDefault } = plan;
        
        return {
          ...planWithoutIsDefault,
          features: {
            additionalFeatures: Array.isArray(plan.features) ? plan.features : [],
          },
        };
      });
    }
  }

  /**
   * プラン詳細を取得
   */
  async findPlanByName(name: string) {
    // DBからプラン情報を取得
    const plan = await prisma.plan.findUniqueOrThrow({
      where: { name },
    });

    // isDefaultプロパティを除外
    const { isDefault, ...planWithoutIsDefault } = plan;

    try {
      // PAY.JPから最新のプラン情報を取得
      const payjpPlan = await payjp.plans.retrieve(plan.payjpPlanId);
      
      return {
        ...planWithoutIsDefault,
        amount: payjpPlan?.amount || 0,
        interval: payjpPlan?.interval || "month",
        features: {
          additionalFeatures: Array.isArray(plan.features) ? plan.features : [],
        },
      };
    } catch (error) {
      logger.error(`PAY.JP APIエラー: ${JSON.stringify(error)}`);
      
      // エラーが発生した場合はDBの情報のみを返却
      return {
        ...planWithoutIsDefault,
        amount: 0, // デフォルト値を設定
        interval: "month", // デフォルト値を設定
        features: {
          additionalFeatures: Array.isArray(plan.features) ? plan.features : [],
        },
      };
    }
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

    try {
      const payjpPlan = await payjp.plans.create({
        currency: 'jpy',
        amount: dto.amount,
        interval: dto.billingPeriod,
        name: dto.name,
      })

      // DBにプランを作成
      const plan = await prisma.plan.create({
        data: {
          name: dto.name,
          payjpPlanId: payjpPlan.id,
          features: dto.features || [],
          status: dto.status,
        },
      });

      // isDefaultプロパティを除外
      const { isDefault, ...planWithoutIsDefault } = plan;

      return {
        ...planWithoutIsDefault,
        amount: payjpPlan.amount,
        interval: payjpPlan.interval,
      };
    } catch (error) {
      logger.error(`PayJP APIエラー: ${JSON.stringify(error)}`);
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

    // 更新データの準備
    const updateData: Prisma.PlanUpdateInput = {
      ...dto,
      features: dto.features || existingPlan.features,
    };

    try {
      // PAY.JPのプラン更新（名前のみ）
      await payjp.plans.update(existingPlan.payjpPlanId, {
        name: dto.name,
      });

      // DBプランを更新
      const updatedPlan = await prisma.plan.update({
        where: { name },
        data: updateData,
      });

      // PAY.JPからプラン情報取得（料金・課金間隔などを含む最新情報）
      const payjpPlan = await payjp.plans.retrieve(updatedPlan.payjpPlanId);

      // isDefaultプロパティを除外
      const { isDefault, ...planWithoutIsDefault } = updatedPlan;

      return {
        ...planWithoutIsDefault,
        amount: payjpPlan?.amount || 0,
        interval: payjpPlan?.interval || "month",
      };
    } catch (error) {
      logger.error(`PayJP APIエラー: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(
        "プランのPayJP情報の更新に失敗しました",
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
      await payjp.plans.delete(existingPlan.payjpPlanId);

      // DBから削除
      await prisma.plan.delete({ where: { name } });
    } catch (error) {
      logger.error(`プラン削除エラー: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException("プランの削除に失敗しました");
    }
  }
}
