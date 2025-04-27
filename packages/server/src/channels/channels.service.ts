import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async create(userId: number, createChannelDto: CreateChannelDto) {
    // 既にチャンネルを持っているか確認
    const existingChannel = await this.prisma.channel.findUnique({
      where: { userId },
    });

    if (existingChannel) {
      throw new ConflictException('既にチャンネルを作成しています');
    }

    // チャンネルの作成
    const channel = await this.prisma.channel.create({
      data: {
        name: createChannelDto.name,
        description: createChannelDto.description,
        banner: createChannelDto.banner,
        userId,
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
    });

    return channel;
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;

    // 検索条件の構築
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // チャンネルの取得
    const [channels, totalCount] = await Promise.all([
      this.prisma.channel.findMany({
        skip,
        take: limit,
        where,
        orderBy: {
          subscriberCount: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              videos: true,
              subscriptions: true,
            },
          },
        },
      }),
      this.prisma.channel.count({ where }),
    ]);

    return {
      data: channels,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async findOne(id: number) {
    const channel = await this.prisma.channel.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        videos: {
          take: 12,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            views: true,
            createdAt: true,
            duration: true,
          },
        },
        _count: {
          select: {
            videos: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException(`ID: ${id} のチャンネルが見つかりません`);
    }

    return channel;
  }

  async findUserChannel(userId: number) {
    const channel = await this.prisma.channel.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            videos: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('あなたのチャンネルが見つかりません');
    }

    return channel;
  }

  async update(id: number, userId: number, updateChannelDto: UpdateChannelDto) {
    // チャンネルの存在確認
    const channel = await this.prisma.channel.findUnique({
      where: { id },
    });

    if (!channel) {
      throw new NotFoundException(`ID: ${id} のチャンネルが見つかりません`);
    }

    // 権限チェック（チャンネル所有者のみ更新可能）
    if (channel.userId !== userId) {
      throw new ForbiddenException('このチャンネルを編集する権限がありません');
    }

    // チャンネルの更新
    const updatedChannel = await this.prisma.channel.update({
      where: { id },
      data: {
        name: updateChannelDto.name,
        description: updateChannelDto.description,
        banner: updateChannelDto.banner,
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
    });

    return updatedChannel;
  }

  async subscribe(userId: number, channelId: number) {
    // チャンネルの存在確認
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException(`ID: ${channelId} のチャンネルが見つかりません`);
    }

    // 自分自身のチャンネルには登録できない
    if (channel.userId === userId) {
      throw new ForbiddenException('自分自身のチャンネルには登録できません');
    }

    // 既に登録しているか確認
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: {
        channelId,
        subscriberId: userId,
      },
    });

    // 登録済みの場合は解除（トグル）
    if (existingSubscription) {
      await this.prisma.subscription.delete({
        where: { id: existingSubscription.id },
      });

      // チャンネルの登録者数を減らす
      await this.prisma.channel.update({
        where: { id: channelId },
        data: {
          subscriberCount: {
            decrement: 1,
          },
        },
      });

      return {
        action: 'unsubscribed',
        message: 'チャンネル登録を解除しました',
      };
    }

    // 新規登録
    await this.prisma.subscription.create({
      data: {
        channelId,
        subscriberId: userId,
      },
    });

    // チャンネルの登録者数を増やす
    await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        subscriberCount: {
          increment: 1,
        },
      },
    });

    return {
      action: 'subscribed',
      message: 'チャンネル登録しました',
    };
  }

  async checkSubscription(userId: number, channelId: number) {
    // チャンネルの存在確認
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException(`ID: ${channelId} のチャンネルが見つかりません`);
    }

    // 登録状態の確認
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        channelId,
        subscriberId: userId,
      },
    });

    return {
      channelId,
      isSubscribed: !!subscription,
    };
  }

  async getSubscriptions(userId: number) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        subscriberId: userId,
      },
      include: {
        channel: {
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return subscriptions.map(sub => sub.channel);
  }
} 
