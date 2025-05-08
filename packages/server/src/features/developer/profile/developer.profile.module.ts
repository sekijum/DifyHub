import { Module } from "@nestjs/common";
import { DeveloperProfileService } from "./developer.profile.service";
import { DeveloperProfileController } from "./developer.profile.controller";

@Module({
  controllers: [DeveloperProfileController],
  providers: [DeveloperProfileService],
  exports: [DeveloperProfileService],
})
export class DeveloperProfileModule {}
