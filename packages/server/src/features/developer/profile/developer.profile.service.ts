import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

// プロフィール詳細情報の型
export interface DeveloperProfile {
  id: number;
  userId: number;
  name: string;
  developerName?: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  // 追加のプロフィール情報があれば拡張可能
  appsCount?: number;   // 公開アプリ数
  totalUsageCount?: number;  // 全アプリの合計使用回数
}

@Injectable()
export class DeveloperProfileService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  /**
   * 開発者プロフィールを取得
   */
  async getProfile(userId: number): Promise<DeveloperProfile> {
    // ユーザー情報を取得
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        developerName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('ユーザーが見つかりません');
    }

    // アプリの数をカウント
    const appsCount = await this.prisma.app.count({
      where: { creatorId: userId }
    });

    // アプリの合計使用回数を取得
    const appStats = await this.prisma.app.aggregate({
      where: { creatorId: userId },
      _sum: {
        usageCount: true,
      },
    });

    // プロフィール情報を構築して返す
    return {
      id: user.id,
      userId: user.id,
      name: user.name || '',
      developerName: user.developerName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      appsCount: appsCount,
      totalUsageCount: appStats._sum.usageCount || 0,
    };
  }

  /**
   * 開発者プロフィールを更新
   */
  async updateProfile(
    userId: number, 
    updateDto: UpdateProfileDto
  ): Promise<DeveloperProfile> {
    try {
      // ユーザー情報が存在するか確認
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('ユーザーが見つかりません');
      }

      // 更新データを構築
      const updateData: any = {};

      // 名前の更新
      if (updateDto.name !== undefined) {
        updateData.name = updateDto.name;
      }

      // 開発者名の更新
      if (updateDto.developerName !== undefined) {
        updateData.developerName = updateDto.developerName;
      }

      // 自己紹介の更新
      if (updateDto.bio !== undefined) {
        updateData.bio = updateDto.bio;
      }

      // アバター画像の処理
      if (updateDto.avatarUrl) {
        // 直接URLを使用
        updateData.avatarUrl = updateDto.avatarUrl;
      } else if (updateDto.removeAvatar) {
        // アバターを削除
        updateData.avatarUrl = null;
      }

      // ユーザー情報を更新
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          developerName: true,
          bio: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // アプリの数をカウント
      const appsCount = await this.prisma.app.count({
        where: { creatorId: userId }
      });

      // アプリの合計使用回数を取得
      const appStats = await this.prisma.app.aggregate({
        where: { creatorId: userId },
        _sum: {
          usageCount: true,
        },
      });

      // 更新されたプロフィール情報を返す
      return {
        id: updatedUser.id,
        userId: updatedUser.id,
        name: updatedUser.name || '',
        developerName: updatedUser.developerName,
        bio: updatedUser.bio,
        avatarUrl: updatedUser.avatarUrl,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        appsCount: appsCount,
        totalUsageCount: appStats._sum.usageCount || 0,
      };
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      throw new BadRequestException('プロフィールの更新に失敗しました');
    }
  }
} 
