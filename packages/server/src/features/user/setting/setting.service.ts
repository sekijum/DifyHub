import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { Setting } from '@prisma/client';

@Injectable()
export class SettingService {
  private readonly SETTING_ID = 1; // 設定は常に1レコードのみ存在し、IDは1

  constructor(
    private readonly prisma: PrismaService
  ) {}

  /**
   * 設定を取得
   * レコードが存在しない場合でもエラーを返さず、デフォルト値で応答
   */
  async findSetting(): Promise<Setting> {
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { id: this.SETTING_ID },
      });

      return setting || this.getDefaultSettings();
    } catch (error) {
      // エラー発生時もデフォルト設定を返す
      return this.getDefaultSettings();
    }
  }

  /**
   * デフォルト設定値を取得（DBへの保存は行わない）
   * @private
   */
  private getDefaultSettings(): Setting {
    return {
      id: this.SETTING_ID,
      maintenanceMode: false,
      commissionRate: 0.15, // デフォルト手数料率 15%
      payoutFee: 500, // デフォルト出金手数料 500円
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
} 
