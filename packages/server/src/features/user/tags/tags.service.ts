import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { AppStatus } from '@prisma/client';
import { TagDto } from './dto/tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 公開されているアプリに関連付けが多い順に上位5件のタグを取得します。
   */
  async findPopular(): Promise<TagDto[]> {
    const tags = await this.prisma.tag.findMany({
      where: {
        // 公開されているアプリが少なくとも1つ紐づいているタグのみを対象とする
        apps: {
          some: { status: AppStatus.PUBLISHED }
        }
      },
      take: 5,
      include: {
        _count: {
          select: { 
             // 並び替えのために公開アプリ数をカウント
            apps: { where: { status: AppStatus.PUBLISHED } } 
          },
        },
      },
      orderBy: {
         // 公開アプリ数で降順ソート
        apps: {
          _count: 'desc',
        },
      },
    });

    // where句で絞り込んでいるため、後続の filter は不要
    // const popularTags = tags.filter(tag => tag._count.apps > 0);

    return tags.map(TagDto.fromEntity);
  }

  /**
   * すべてのタグを名前順で取得します。
   * オプションで公開アプリ数をカウントします。
   */
  async findAll(): Promise<TagDto[]> {
    const tags = await this.prisma.tag.findMany({
      include: {
        _count: {
          select: { 
            apps: { where: { status: AppStatus.PUBLISHED } } 
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return tags.map(TagDto.fromEntity);
  }
} 
