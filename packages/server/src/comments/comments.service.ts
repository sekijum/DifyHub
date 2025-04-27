import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createCommentDto: CreateCommentDto) {
    // 動画が存在するか確認
    const video = await this.prisma.video.findUnique({
      where: { id: createCommentDto.videoId },
    });

    if (!video) {
      throw new NotFoundException(`ID: ${createCommentDto.videoId} の動画が見つかりません`);
    }

    // コメントの作成
    const comment = await this.prisma.comment.create({
      data: {
        text: createCommentDto.text,
        userId,
        videoId: createCommentDto.videoId,
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

    return comment;
  }

  async findAll(videoId: number) {
    // 動画が存在するか確認
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException(`ID: ${videoId} の動画が見つかりません`);
    }

    // コメントの取得
    const comments = await this.prisma.comment.findMany({
      where: { videoId },
      orderBy: { createdAt: 'desc' },
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

    return comments;
  }

  async findOne(id: number) {
    // コメントの取得
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        video: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException(`ID: ${id} のコメントが見つかりません`);
    }

    return comment;
  }

  async update(id: number, userId: number, updateCommentDto: UpdateCommentDto) {
    // コメントの存在確認
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`ID: ${id} のコメントが見つかりません`);
    }

    // 権限チェック（コメント投稿者のみ更新可能）
    if (comment.userId !== userId) {
      throw new ForbiddenException('このコメントを編集する権限がありません');
    }

    // コメントの更新
    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: {
        text: updateCommentDto.text,
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

    return updatedComment;
  }

  async remove(id: number, userId: number) {
    // コメントの存在確認
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`ID: ${id} のコメントが見つかりません`);
    }

    // 権限チェック（コメント投稿者のみ削除可能）
    if (comment.userId !== userId) {
      throw new ForbiddenException('このコメントを削除する権限がありません');
    }

    // コメントの削除
    await this.prisma.comment.delete({
      where: { id },
    });

    return { message: `ID: ${id} のコメントを削除しました` };
  }
} 
