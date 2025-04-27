import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLikeDto } from './dto/create-like.dto';

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createLikeDto: CreateLikeDto) {
    // 動画が存在するか確認
    const video = await this.prisma.video.findUnique({
      where: { id: createLikeDto.videoId },
    });

    if (!video) {
      throw new NotFoundException(`ID: ${createLikeDto.videoId} の動画が見つかりません`);
    }

    // 既に評価しているか確認
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_videoId: {
          userId,
          videoId: createLikeDto.videoId,
        },
      },
    });

    if (existingLike) {
      // 既存の評価と同じ場合は削除（評価の取り消し）
      if (existingLike.isLike === createLikeDto.isLike) {
        await this.prisma.like.delete({
          where: { id: existingLike.id },
        });
        return {
          action: 'removed',
          message: `${createLikeDto.isLike ? '高評価' : '低評価'}を取り消しました`,
        };
      }
      
      // 既存の評価と異なる場合は更新
      const updatedLike = await this.prisma.like.update({
        where: { id: existingLike.id },
        data: { isLike: createLikeDto.isLike },
      });
      
      return {
        action: 'updated',
        message: `${createLikeDto.isLike ? '高評価' : '低評価'}に変更しました`,
        like: updatedLike,
      };
    }

    // 新規評価の作成
    const like = await this.prisma.like.create({
      data: {
        isLike: createLikeDto.isLike,
        userId,
        videoId: createLikeDto.videoId,
      },
    });

    return {
      action: 'created',
      message: `${createLikeDto.isLike ? '高評価' : '低評価'}しました`,
      like,
    };
  }

  async findAll(videoId: number) {
    // 動画が存在するか確認
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException(`ID: ${videoId} の動画が見つかりません`);
    }

    // いいね・よくないねの数をカウント
    const [likes, dislikes] = await Promise.all([
      this.prisma.like.count({
        where: {
          videoId,
          isLike: true,
        },
      }),
      this.prisma.like.count({
        where: {
          videoId,
          isLike: false,
        },
      }),
    ]);

    return {
      videoId,
      likes,
      dislikes,
    };
  }

  async getUserLike(userId: number, videoId: number) {
    // 動画が存在するか確認
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException(`ID: ${videoId} の動画が見つかりません`);
    }

    // ユーザーの評価を取得
    const like = await this.prisma.like.findUnique({
      where: {
        userId_videoId: {
          userId,
          videoId,
        },
      },
    });

    if (!like) {
      return { videoId, status: 'none' };
    }

    return {
      videoId,
      status: like.isLike ? 'like' : 'dislike',
      like,
    };
  }

  async remove(userId: number, videoId: number) {
    // 動画が存在するか確認
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException(`ID: ${videoId} の動画が見つかりません`);
    }

    // いいねの存在確認
    const like = await this.prisma.like.findUnique({
      where: {
        userId_videoId: {
          userId,
          videoId,
        },
      },
    });

    if (!like) {
      throw new NotFoundException('この動画に対する評価が見つかりません');
    }

    // いいねの削除
    await this.prisma.like.delete({
      where: { id: like.id },
    });

    return { message: '評価を削除しました' };
  }
} 
