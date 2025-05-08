import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { prisma } from "@/core/database/prisma.client";
import { logger } from "@/core/utils";

@Injectable()
export class SettingService {
  private readonly SETTING_ID = 1; // 設定は常に1レコードのみ存在し、IDは1

  /**
   * 設定を取得
   * レコードが存在しない場合でもエラーを返さず、デフォルト値で応答
   */
  async findSetting() {
    try {
      const setting = await prisma.setting.findUniqueOrThrow({
        where: { id: this.SETTING_ID },
      });

      return setting;
    } catch (error) {
      logger.error(`設定取得エラー: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(
        "システム設定の取得に失敗しました",
      );
    }
  }
}
