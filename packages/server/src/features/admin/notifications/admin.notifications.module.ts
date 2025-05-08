import { Module } from "@nestjs/common";
import { AdminNotificationsController } from "./admin.notifications.controller";
import { AdminNotificationsService } from "./admin.notifications.service";

@Module({
  controllers: [AdminNotificationsController],
  providers: [AdminNotificationsService],
})
export class AdminNotificationsModule {}
