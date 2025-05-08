import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { prisma } from "@/core/database/prisma.client";
import { Prisma } from "@prisma/client";
import { FindTagListQueryDto, CreateTagDto, UpdateTagDto } from "./dto";
import {
  createPaginatedResponse,
  getPaginationParams,
} from "@/core/utils/pagination.util";

@Injectable()
export class AdminTagsService {
  /**
   * タグ一覧を取得
   */
  async findTagList(query: FindTagListQueryDto) {
    const pagination = getPaginationParams(query);

    // 検索条件の構築
    const where: Prisma.TagWhereInput = {};
    if (pagination.search) {
      where.name = {
        contains: pagination.search,
        mode: "insensitive",
      };
    }

    // タグ数とリストを取得
    const [tags, total] = await prisma.$transaction([
      prisma.tag.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              apps: true,
            },
          },
        },
      }),
      prisma.tag.count({ where }),
    ]);

    // アプリ数を含めたレスポンス形式に変換
    const formattedTags = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      appCount: tag._count.apps,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    }));

    return createPaginatedResponse(
      formattedTags,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  /**
   * タグ詳細を取得
   */
  async findTagById(id: number) {
    const tag = await prisma.tag.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        name: true,
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
      id: tag.id,
      name: tag.name,
      appCount: tag._count.apps,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }

  /**
   * タグを作成
   */
  async createTag(createDto: CreateTagDto) {
    // 名前の重複チェック
    const existingTag = await prisma.tag.findUnique({
      where: { name: createDto.name },
    });

    if (existingTag) {
      throw new ConflictException("同じ名前のタグが既に存在します");
    }

    // タグを作成
    const tag = await prisma.tag.create({
      data: createDto,
    });

    return tag;
  }

  /**
   * タグを更新
   */
  async updateTag(id: number, updateDto: UpdateTagDto) {
    // タグの存在確認
    const tag = await prisma.tag.findUniqueOrThrow({
      where: { id },
    });

    // 名前の重複チェック
    if (updateDto.name !== tag.name) {
      const existingTag = await prisma.tag.findUnique({
        where: { name: updateDto.name },
      });

      if (existingTag) {
        throw new ConflictException("同じ名前のタグが既に存在します");
      }
    }

    // タグを更新
    const updatedTag = await prisma.tag.update({
      where: { id },
      data: updateDto,
    });

    return updatedTag;
  }

  /**
   * タグを削除
   */
  async deleteTag(id: number) {
    // タグの存在確認
    const tag = await prisma.tag.findUniqueOrThrow({
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
    if (tag._count.apps > 0) {
      throw new ConflictException(
        "このタグを使用しているアプリがあるため削除できません",
      );
    }

    // タグを削除
    await prisma.tag.delete({
      where: { id },
    });

    return { success: true };
  }
}
