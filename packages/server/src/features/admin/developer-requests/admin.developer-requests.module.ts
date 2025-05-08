import { Module } from "@nestjs/common";
import { AdminDeveloperRequestsController } from "./admin.developer-requests.controller";
import { AdminDeveloperRequestsService } from "./admin.developer-requests.service";
import { MailerConfigModule } from "@/core/mailer/mailer.module";

@Module({
  imports: [MailerConfigModule],
  controllers: [AdminDeveloperRequestsController],
  providers: [AdminDeveloperRequestsService],
  exports: [AdminDeveloperRequestsService],
})
export class AdminDeveloperRequestsModule {}
