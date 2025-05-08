import { Module } from "@nestjs/common";
import { AdminCategoriesController } from "./admin.categories.controller";
import { AdminCategoriesService } from "./admin.categories.service";

@Module({
  controllers: [AdminCategoriesController],
  providers: [AdminCategoriesService],
  exports: [AdminCategoriesService],
})
export class AdminCategoriesModule {}
