import { Module } from "@nestjs/common";
import { AdminSettingController } from "./admin.setting.controller";
import { AdminSettingService } from "./admin.setting.service";

@Module({
  controllers: [AdminSettingController],
  providers: [AdminSettingService],
  exports: [AdminSettingService],
})
export class AdminSettingModule {}
