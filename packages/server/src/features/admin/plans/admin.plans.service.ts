import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { Plan, Prisma, PlanStatus } from '@prisma/client';
import { GetPlansQueryDto } from './dto/get-plans-query.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

// ページネーション結果型
export interface PaginatedPlansResult {
  data: Plan[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class AdminPlansService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  /**
   * プラン一覧を取得
   */
  async findPlans(query: GetPlansQueryDto): Promise<PaginatedPlansResult> {
    const { page = 1, limit = 25, search } = query;
    
    const where: Prisma.PlanWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
      ];
    }

    const [plans, total] = await Promise.all([
      this.prisma.plan.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.plan.count({ where }),
    ]);

    // クライアント側が期待する形式に変換
    const processedPlans = plans.map(plan => {
      const planData = plan as any;
      return {
        ...planData,
        features: {
          additionalFeatures: Array.isArray(planData.features) ? planData.features : []
        }
      };
    });

    return {
      data: processedPlans,
      total,
      page,
      limit,
    };
  }

  /**
   * プラン詳細を取得
   */
  async findPlanById(name: string): Promise<any> {
    const plan = await this.prisma.plan.findUnique({
      where: { name },
    });

    if (!plan) {
      throw new NotFoundException(`プラン "${name}" が見つかりません。`);
    }

    // クライアント側が期待する形式に変換
    const planData = plan as any;
    return {
      ...planData,
      features: {
        additionalFeatures: Array.isArray(planData.features) ? planData.features : []
      }
    };
  }

  /**
   * プランを作成
   */
  async createPlan(createDto: CreatePlanDto): Promise<Plan> {
    const { 
      name, 
      price, 
      features: featuresList,
      status = PlanStatus.ACTIVE
    } = createDto;

    // プラン名の重複チェック
    const existingPlan = await this.prisma.plan.findUnique({
      where: { name },
    });

    if (existingPlan) {
      throw new ConflictException(`プラン名 "${name}" はすでに使用されています。`);
    }

    // featuresを直接配列として設定
    const features = featuresList || ["+test01", "-test02"];

    return this.prisma.plan.create({
      data: {
        name,
        priceMonthly: price,
        features,
        status,
      },
    });
  }

  /**
   * プランを更新
   */
  async updatePlan(name: string, updateDto: UpdatePlanDto): Promise<Plan> {
    // 対象プランの存在確認
    await this.findPlanById(name);

    const { 
      name: newName, 
      price, 
      features: featuresList,
      status
    } = updateDto;

    // 更新データの準備
    const updateData: Prisma.PlanUpdateInput = {};
    
    if (price !== undefined) updateData.priceMonthly = price;
    if (status !== undefined) updateData.status = status;
    
    // featuresを直接配列として設定
    updateData.features = featuresList || ["+test01", "-test02"];
    
    return this.prisma.plan.update({
      where: { name },
      data: {
        ...(newName ? { name: newName } : {}),
        ...updateData,
      },
    });
  }

  /**
   * プランを削除
   */
  async deletePlan(name: string): Promise<void> {
    // 対象プランの存在確認
    await this.findPlanById(name);

    // このプランを使用中のユーザーがいるか確認
    const usersCount = await this.prisma.user.count({
      where: { planName: name },
    });

    if (usersCount > 0) {
      throw new ConflictException(
        `このプランは${usersCount}人のユーザーが利用中のため削除できません。`
      );
    }

    await this.prisma.plan.delete({
      where: { name },
    });
  }
} 
