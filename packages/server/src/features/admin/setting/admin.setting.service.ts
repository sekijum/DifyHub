import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { Setting, Prisma } from '@prisma/client';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class AdminSettingService {
  private readonly SETTING_ID = 1; // 設定は常に1レコードのみ存在し、IDは1

  constructor(
    private readonly prisma: PrismaService
  ) {}

  /**
   * 設定を取得
   */
  async findSetting(): Promise<Setting> {
    const setting = await this.prisma.setting.findUnique({
      where: { id: this.SETTING_ID },
    });

    if (!setting) {
      // 設定が存在しない場合はデフォルト値で作成
      return this.createDefaultSetting();
    }

    return setting;
  }

  /**
   * 設定を更新
   */
  async updateSetting(updateDto: UpdateSettingDto): Promise<Setting> {
    // 更新データの準備
    const updateData: Prisma.SettingUpdateInput = {};
    
    if (updateDto.maintenanceMode !== undefined) updateData.maintenanceMode = updateDto.maintenanceMode;
    if (updateDto.commissionRate !== undefined) updateData.commissionRate = updateDto.commissionRate;
    if (updateDto.payoutFee !== undefined) updateData.payoutFee = updateDto.payoutFee;
    
    try {
      // 更新を試みる
      return await this.prisma.setting.update({
        where: { id: this.SETTING_ID },
        data: updateData,
      });
    } catch (error) {
      // レコードが存在しない場合はデフォルト設定を作成してから更新
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        await this.createDefaultSetting();
        
        return this.prisma.setting.update({
          where: { id: this.SETTING_ID },
          data: updateData,
        });
      }
      // その他のエラーは再スロー
      throw error;
    }
  }

  /**
   * デフォルト設定を作成
   * @private
   */
  private async createDefaultSetting(): Promise<Setting> {
    return this.prisma.setting.create({
      data: {
        id: this.SETTING_ID,
        maintenanceMode: false,
        commissionRate: 0.15, // デフォルト手数料率 15%
        payoutFee: 500, // デフォルト出金手数料 500円
      },
    });
  }
} 
