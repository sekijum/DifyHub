import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { prisma } from "@/core/database/prisma.client";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { RatingType } from "@prisma/client";

@Injectable()
export class DeveloperProfileService {
  private readonly logger = new Logger(DeveloperProfileService.name);

  /**
   * 開発者プロフィールを取得
   */
  async findById(userId: number) {
    try {
      // ユーザー情報を取得
      const user = await prisma.user.findUniqueOrThrow({
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

      // アプリの数をカウント
      const appsCount = await prisma.app.count({
        where: { creatorId: userId },
      });

      // アプリの合計使用回数を取得
      const appStats = await prisma.app.aggregate({
        where: { creatorId: userId },
        _sum: {
          usageCount: true,
        },
      });

      // プロフィール情報を構築して返す
      return {
        id: user.id,
        userId: user.id,
        name: user.name || "",
        developerName: user.developerName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        appsCount: appsCount,
        totalUsageCount: appStats._sum || 0,
      };
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`ユーザーID ${userId} が見つかりません`);
      }
      this.logger.error(
        `プロフィール取得エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException(
        "プロフィール情報の取得中にエラーが発生しました",
      );
    }
  }

  /**
   * 開発者ダッシュボード統計情報を取得
   */
  async getDashboardStats(userId: number) {
    try {
      // ユーザー存在確認
      await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { id: true },
      });

      // アプリの数をカウント
      const appsCount = await prisma.app.count({
        where: { creatorId: userId },
      });

      // アプリのIDリスト取得
      const apps = await prisma.app.findMany({
        where: { creatorId: userId },
        select: { id: true },
      });

      const appIds = apps.map((app) => app.id);

      // アプリが存在しない場合
      if (appIds.length === 0) {
        return {
          totalAppsCount: 0,
          totalUsageCount: 0,
          totalLikesCount: 0,
          totalDislikesCount: 0,
          likeRatio: 0,
        };
      }

      // アプリの合計使用回数を取得
      const usageStats = await prisma.app.aggregate({
        where: { id: { in: appIds } },
        _sum: { usageCount: true },
      });

      // 評価情報を取得
      const likesCount = await prisma.rating.count({
        where: {
          appId: { in: appIds },
          type: RatingType.LIKE,
        },
      });

      const dislikesCount = await prisma.rating.count({
        where: {
          appId: { in: appIds },
          type: RatingType.DISLIKE,
        },
      });

      // 評価率の計算
      const totalRatings = likesCount + dislikesCount;
      const likeRatio =
        totalRatings > 0 ? (likesCount / totalRatings) * 100 : 0;

      return {
        totalAppsCount: appsCount,
        totalUsageCount: usageStats._sum.usageCount || 0,
        totalLikesCount: likesCount,
        totalDislikesCount: dislikesCount,
        likeRatio: Math.round(likeRatio * 10) / 10, // 小数点第一位まで
      };
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`ユーザーID ${userId} が見つかりません`);
      }
      this.logger.error(
        `ダッシュボード統計取得エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException(
        "ダッシュボード統計情報の取得中にエラーが発生しました",
      );
    }
  }

  /**
   * 開発者プロフィールを更新
   */
  async update(userId: number, updateDto: UpdateProfileDto) {
    try {
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

      // データに変更がない場合はエラー
      if (Object.keys(updateData).length === 0) {
        throw new BadRequestException("更新するデータがありません");
      }

      // ユーザー情報を更新
      const updatedUser = await prisma.user.update({
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

      // 更新されたプロフィール情報を返す
      return {
        id: updatedUser.id,
        userId: updatedUser.id,
        name: updatedUser.name || "",
        developerName: updatedUser.developerName,
        bio: updatedUser.bio,
        avatarUrl: updatedUser.avatarUrl,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === "P2025") {
        throw new NotFoundException(`ユーザーID ${userId} が見つかりません`);
      }
      this.logger.error(
        `プロフィール更新エラー: ${error.message}`,
        error.stack,
        this.constructor.name,
      );
      throw new InternalServerErrorException(
        "プロフィールの更新中にエラーが発生しました",
      );
    }
  }
}
