import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationDto } from './dto/notification.dto';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';

// Serviceからインポートするか、ここで再度定義
interface NotificationListResponse {
    data: NotificationDto[];
    total: number;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * お知らせ一覧取得 (ページネーション対応)
   */
  @Get()
  findAll(
    // クエリパラメータのバリデーションと変換
    @Query(new ValidationPipe({ 
      transform: true, // クエリパラメータを DTO の型に変換
      whitelist: true, // DTO に定義されていないプロパティを除去
      // forbidNonWhitelisted: true, // 念のため無効化しておく
    })) 
    query: GetNotificationsQueryDto,
  ): Promise<NotificationListResponse> {
    return this.notificationsService.findAll(query);
  }

  /**
   * トップページ表示用お知らせ取得
   */
  @Get('top')
  findForTopPage(): Promise<NotificationDto[]> {
    return this.notificationsService.findForTopPage();
  }
} 
