import { Controller, Get, Query } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { FindNotificationListQueryDto } from "./dto";

/**
 * お知らせ関連のエンドポイントを提供するコントローラー
 */
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * お知らせ一覧取得 (ページネーション対応)
   */
  @Get()
  findNotificationList(@Query() query: FindNotificationListQueryDto) {
    return this.notificationsService.findNotificationList(query);
  }

  /**
   * トップページ表示用お知らせ取得
   */
  @Get("top")
  findTopNotificationList() {
    return this.notificationsService.findTopNotificationList();
  }
}
