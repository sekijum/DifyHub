import { Module } from "@nestjs/common";
import { DeveloperAppsController } from "./developer.apps.controller";
import { DeveloperAppsService } from "./developer.apps.service";

@Module({
  controllers: [DeveloperAppsController],
  providers: [DeveloperAppsService],
  exports: [DeveloperAppsService],
})
export class DeveloperAppsModule {}
