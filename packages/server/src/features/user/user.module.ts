import { Module } from "@nestjs/common";
import { UsersModule } from "./users/users.module";
import { AppsModule } from "./apps/apps.module";
import { CategoriesModule } from "./categories/categories.module";
import { TagsModule } from "./tags/tags.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { SettingModule } from "./setting/setting.module";
import { AuthModule } from "./users/auth/auth.module";
import { UserPlansModule } from "./plans/user.plans.module";

@Module({
  imports: [
    UsersModule,
    AuthModule,
    AppsModule,
    CategoriesModule,
    TagsModule,
    NotificationsModule,
    SettingModule,
    UserPlansModule,
  ],
  exports: [
    UsersModule,
    AuthModule,
    AppsModule,
    CategoriesModule,
    TagsModule,
    NotificationsModule,
    SettingModule,
    UserPlansModule,
  ],
})
export class UserModule {}
