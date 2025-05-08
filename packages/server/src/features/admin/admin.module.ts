import { Module } from "@nestjs/common";
import { AdminAppsModule } from "./apps/admin.apps.module";
import { AdminUsersModule } from "./users/admin.users.module";
import { AdminPlansModule } from "./plans/admin.plans.module";
import { AdminSettingModule } from "./setting/admin.setting.module";
import { AdminNotificationsModule } from "./notifications/admin.notifications.module";
import { AdminDeveloperRequestsModule } from "./developer-requests/admin.developer-requests.module";
import { AdminCategoriesModule } from "./categories/admin.categories.module";
import { AdminTagsModule } from "./tags/admin.tags.module";

@Module({
  imports: [
    AdminAppsModule,
    AdminUsersModule,
    AdminPlansModule,
    AdminSettingModule,
    AdminNotificationsModule,
    AdminDeveloperRequestsModule,
    AdminCategoriesModule,
    AdminTagsModule,
  ],
  exports: [
    AdminAppsModule,
    AdminUsersModule,
    AdminPlansModule,
    AdminSettingModule,
    AdminNotificationsModule,
    AdminDeveloperRequestsModule,
    AdminCategoriesModule,
    AdminTagsModule,
  ],
})
export class AdminModule {}
