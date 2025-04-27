import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideoQueryDto } from './dto/video-query.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VideosService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async create(
    userId: number,
    createVideoDto: CreateVideoDto,
    videoFile: Express.Multer.File,
    thumbnailFile?: Express.Multer.File,
  ) {
    // チャンネルの取得または作成
    const channel = await this.prisma.channel.findUnique({
      where: { userId },
    });

    if (!channel) {
      throw new ForbiddenException(
        'チャンネルを作成してから動画をアップロードしてください',
      );
    }

    // 動画ファイルのアップロード
    const videoFileName = `videos/${uuidv4()}-${videoFile.originalname}`;
    const videoUrl = await this.storageService.uploadFile(
      videoFile,
      videoFileName,
    );

    // サムネイルのアップロードまたは生成
    let thumbnailUrl: string;
    if (thumbnailFile) {
      // サムネイルファイルがアップロードされた場合
      const thumbnailFileName = `thumbnails/${uuidv4()}-${thumbnailFile.originalname}`;
      thumbnailUrl = await this.storageService.uploadFile(
        thumbnailFile,
        thumbnailFileName,
      );
    } else {
      // サムネイルが提供されない場合、自動生成
      const thumbnail = await this.storageService.generateThumbnail(
        videoFile.buffer,
      );
      const thumbnailFileName = `thumbnails/${uuidv4()}.jpg`;
      thumbnailUrl = await this.storageService.uploadBuffer(
        thumbnail,
        thumbnailFileName,
        'image/jpeg',
      );
    }

    // データベースに動画情報を保存
    const video = await this.prisma.video.create({
      data: {
        title: createVideoDto.title,
        description: createVideoDto.description,
        url: videoUrl,
        thumbnailUrl: thumbnailUrl,
        duration: createVideoDto.duration,
        userId,
        channelId: channel.id,
        isShort: createVideoDto.isShort || false,
        tags: createVideoDto.tags
          ? {
              create: createVideoDto.tags.map((tagId) => ({
                tag: {
                  connect: { id: tagId },
                },
              })),
            }
          : undefined,
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            subscriberCount: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return video;
  }

  async findAll(query: VideoQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      tags,
      channelId,
      isShort,
    } = query;

    const skip = (page - 1) * limit;

    // 検索条件の構築
    const where: any = {
      isPublished: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tagId: { in: tags },
        },
      };
    }

    if (channelId) {
      where.channelId = channelId;
    }

    if (isShort !== undefined) {
      where.isShort = isShort;
    }

    // 動画の取得
    const [videos, totalCount] = await Promise.all([
      this.prisma.video.findMany({
        skip,
        take: limit,
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          channel: {
            select: {
              id: true,
              name: true,
              subscriberCount: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      }),
      this.prisma.video.count({ where }),
    ]);

    // 各動画について高評価・低評価の数を取得
    const videosWithLikes = await Promise.all(
      videos.map(async (video) => {
        const [likes, dislikes] = await Promise.all([
          this.prisma.like.count({
            where: {
              videoId: video.id,
              isLike: true,
            },
          }),
          this.prisma.like.count({
            where: {
              videoId: video.id,
              isLike: false,
            },
          }),
        ]);

        return {
          ...video,
          likes,
          dislikes,
        };
      }),
    );

    return {
      data: videosWithLikes,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async findOne(id: number) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            subscriberCount: true,
            banner: true,
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        comments: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!video) {
      throw new NotFoundException(`ID: ${id} の動画が見つかりません`);
    }

    // 視聴回数のインクリメント
    await this.prisma.video.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    // 高評価・低評価のカウント
    const [likes, dislikes] = await Promise.all([
      this.prisma.like.count({
        where: {
          videoId: id,
          isLike: true,
        },
      }),
      this.prisma.like.count({
        where: {
          videoId: id,
          isLike: false,
        },
      }),
    ]);

    // 関連動画の取得
    const tagIds = video.tags.map((t) => t.tagId);
    const relatedVideos = await this.prisma.video.findMany({
      where: {
        id: { not: id },
        isPublished: true,
        OR: [
          {
            tags: {
              some: {
                tagId: { in: tagIds },
              },
            },
          },
          {
            channelId: video.channelId,
          },
        ],
      },
      take: 8,
      orderBy: {
        views: 'desc',
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      ...video,
      likes,
      dislikes,
      relatedVideos,
    };
  }

  async findAllByUser(userId: number) {
    const videos = await this.prisma.video.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    return videos;
  }

  async update(id: number, userId: number, updateVideoDto: UpdateVideoDto) {
    // 動画の存在確認と所有権チェック
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: {
        tags: true,
      },
    });

    if (!video) {
      throw new NotFoundException(`ID: ${id} の動画が見つかりません`);
    }

    if (video.userId !== userId) {
      throw new ForbiddenException('この動画を編集する権限がありません');
    }

    // タグの更新処理
    let tagsUpdateOperation;
    if (updateVideoDto.tags) {
      // 既存のタグ関連を削除
      await this.prisma.tagsOnVideos.deleteMany({
        where: { videoId: id },
      });

      // 新しいタグ関連を作成
      tagsUpdateOperation = {
        create: updateVideoDto.tags.map((tagId) => ({
          tag: {
            connect: { id: tagId },
          },
        })),
      };
    }

    // 動画情報の更新
    const updatedVideo = await this.prisma.video.update({
      where: { id },
      data: {
        title: updateVideoDto.title,
        description: updateVideoDto.description,
        isPublished: updateVideoDto.isPublished,
        isShort: updateVideoDto.isShort,
        tags: tagsUpdateOperation,
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return updatedVideo;
  }

  async remove(id: number, userId: number) {
    // 動画の存在確認と所有権チェック
    const video = await this.prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException(`ID: ${id} の動画が見つかりません`);
    }

    if (video.userId !== userId) {
      throw new ForbiddenException('この動画を削除する権限がありません');
    }

    // ストレージからファイルを削除
    try {
      // URL からファイル名を抽出
      const videoObjectName = video.url.split('/').pop();
      const thumbnailObjectName = video.thumbnailUrl.split('/').pop();

      if (videoObjectName) {
        await this.storageService.deleteFile(`videos/${videoObjectName}`);
      }
      if (thumbnailObjectName) {
        await this.storageService.deleteFile(`thumbnails/${thumbnailObjectName}`);
      }
    } catch (error) {
      // ストレージ削除エラーがあってもデータベースからは削除を続行
      console.error('ストレージファイル削除エラー:', error);
    }

    // データベースから動画を削除
    await this.prisma.video.delete({
      where: { id },
    });

    return { message: `ID: ${id} の動画を削除しました` };
  }
} 
