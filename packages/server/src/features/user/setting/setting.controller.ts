import { Controller, Get } from "@nestjs/common";
import { SettingService } from "./setting.service";

/**
 * システム設定のエンドポイントを提供するコントローラー
 */
@Controller("setting")
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  /**
   * システム設定を取得
   */
  @Get()
  findSetting() {
    return this.settingService.findSetting();
  }
}
