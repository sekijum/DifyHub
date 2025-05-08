import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { prisma } from "@/core/database/prisma.client";
import { Prisma } from "@prisma/client";
import {
  FindCategoryListQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "./dto";
import {
  createPaginatedResponse,
  getPaginationParams,
} from "@/core/utils/pagination.util";

@Injectable()
export class AdminCategoriesService {
  /**
   * カテゴリーリストを取得
   */
  async findCategoryList(query: FindCategoryListQueryDto) {
    const pagination = getPaginationParams(query);

    // 検索条件の構築
    const where: Prisma.CategoryWhereInput = {};
    if (pagination.search) {
      where.name = {
        contains: pagination.search,
        mode: "insensitive",
      };
    }

    // カテゴリー数とリストを取得
    const [data, total] = await prisma.$transaction([
      prisma.category.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              apps: true,
            },
          },
        },
      }),
      prisma.category.count({ where }),
    ]);

    return createPaginatedResponse(
      data,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  /**
   * カテゴリー詳細を取得
   */
  async findCategoryById(id: number) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            apps: true,
          },
        },
      },
    });

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      appCount: category._count.apps,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  /**
   * カテゴリーを作成
   */
  async createCategory(createDto: CreateCategoryDto) {
    // 名前の重複チェック
    const existingCategory = await prisma.category.findUnique({
      where: { name: createDto.name },
    });

    if (existingCategory) {
      throw new ConflictException("同じ名前のカテゴリーが既に存在します");
    }

    // カテゴリーを作成
    const category = await prisma.category.create({
      data: createDto,
    });

    return category;
  }

  /**
   * カテゴリーを更新
   */
  async updateCategory(id: number, updateDto: UpdateCategoryDto) {
    // カテゴリーの存在確認
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException("カテゴリーが見つかりません");
    }

    // 名前の重複チェック（名前を更新する場合のみ）
    if (updateDto.name && updateDto.name !== category.name) {
      const existingCategory = await prisma.category.findUnique({
        where: { name: updateDto.name },
      });

      if (existingCategory) {
        throw new ConflictException("同じ名前のカテゴリーが既に存在します");
      }
    }

    // カテゴリーを更新
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateDto,
    });

    return updatedCategory;
  }

  /**
   * カテゴリーを削除
   */
  async deleteCategory(id: number) {
    // カテゴリーの存在確認
    const category = await prisma.category.findUniqueOrThrow({
      where: { id },
      include: {
        _count: {
          select: {
            apps: true,
          },
        },
      },
    });

    // 関連するアプリがある場合はエラー
    if (category._count.apps > 0) {
      throw new ConflictException(
        "このカテゴリーに属するアプリがあるため削除できません",
      );
    }

    // カテゴリーを削除
    await prisma.category.delete({
      where: { id },
    });

    return { success: true };
  }
}
