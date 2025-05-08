import { Module } from "@nestjs/common";
import { AdminPlansController } from "./admin.plans.controller";
import { AdminPlansService } from "./admin.plans.service";

@Module({
  controllers: [AdminPlansController],
  providers: [AdminPlansService],
  exports: [AdminPlansService],
})
export class AdminPlansModule {}
