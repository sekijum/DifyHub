import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { AppStatus } from '@prisma/client';
import { CategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * すべてのカテゴリを名前順で取得します。
   * オプションで公開アプリ数をカウントします。
   */
  async findAll(): Promise<CategoryDto[]> {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: { 
            apps: { where: { status: AppStatus.PUBLISHED } } 
          },
        },
      },
      orderBy: {
        apps: {
          _count: 'desc',
        },
      },
    });

    return categories.map(CategoryDto.fromEntity);
  }
} 
