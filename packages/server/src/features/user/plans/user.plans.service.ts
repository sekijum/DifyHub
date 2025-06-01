import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { prisma } from "@/core/database/prisma.client";
import { PlanStatus } from "@prisma/client";
import { payjp } from "@/core/payjp";
import { logger } from "@/core/utils";

@Injectable()
export class UserPlansService {
  /**
   * 一般ユーザー向けプラン一覧を取得
   */
  async findPlanList() {
    try {
      // アクティブなプランのみを取得
      const dbPlanList = await prisma.plan.findMany({
        where: {
          status: PlanStatus.ACTIVE,
        },
        orderBy: { 
          createdAt: "asc",  // 作成日時順
        },
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
        
        // isDefaultプロパティも含めて返す
        if (!payjpPlan) {
          return {
            ...plan,
            amount: 0,
            interval: "month",
            features: {
              additionalFeatures: Array.isArray(plan.features) ? plan.features : [],
            },
          };
        }
        
        return {
          ...plan,
          amount: payjpPlan.amount,
          interval: payjpPlan.interval,
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
        where: {
          status: PlanStatus.ACTIVE,
        },
        orderBy: { 
          createdAt: "asc",
        },
      });
      
      return dbPlans.map((plan) => {
        // isDefaultプロパティも含めて返す
        return {
          ...plan,
          features: {
            additionalFeatures: Array.isArray(plan.features) ? plan.features : [],
          },
        };
      });
    }
  }

  /**
   * プラン詳細を取得（名前で検索）
   */
  async findPlanByName(name: string) {
    // DBからアクティブなプラン情報を取得
    const plan = await prisma.plan.findFirst({
      where: { 
        name,
        status: PlanStatus.ACTIVE
      },
    });

    if (!plan) {
      throw new NotFoundException(`プラン "${name}" が見つかりません`);
    }

    try {
      // PAY.JPから最新のプラン情報を取得
      const payjpPlan = plan.payjpPlanId ? await payjp.plans.retrieve(plan.payjpPlanId) : null;
      
      return {
        ...plan,
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
        ...plan,
        amount: 0, // デフォルト値を設定
        interval: "month", // デフォルト値を設定
        features: {
          additionalFeatures: Array.isArray(plan.features) ? plan.features : [],
        },
      };
    }
  }
} 
