import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './core/database/prisma/prisma.module';
import { UsersModule } from './features/user/users/users.module';
import { AuthModule } from './features/user/users/auth/auth.module';
import { MailerConfigModule } from './core/mailer/mailer.module';
import { MeModule } from './features/me/me.module';
import { AppsModule } from './features/user/apps/apps.module';
import { CategoriesModule } from './features/user/categories/categories.module';
import { TagsModule } from './features/user/tags/tags.module';
import { NotificationsModule } from './features/user/notifications/notifications.module';
import { AdminUsersModule } from './features/admin/users/admin.users.module';
import { AdminDeveloperRequestsModule } from './features/admin/developer-requests/admin.developer-requests.module';
import { AdminAppsModule } from './features/admin/apps/admin.apps.module';
import { AdminNotificationsModule } from './features/admin/notifications/admin.notifications.module';
import { AdminPlansModule } from './features/admin/plans/admin.plans.module';
import { AdminSettingModule } from './features/admin/setting/admin.setting.module';
import { SettingModule } from './features/user/setting/setting.module';
import { DeveloperModule } from './features/developer/developer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // NODE_ENV をチェックして開発環境かどうかを判断
        const isDevelopment = configService.get<string>('NODE_ENV') !== 'production';

        // 開発環境と本番環境で異なる設定を返す
        return [{
          ttl: isDevelopment ? 60000 : (configService.get<number>('THROTTLE_TTL', 60) * 1000),
          limit: isDevelopment ? 100 : configService.get<number>('THROTTLE_LIMIT', 10),
        }];
      },
    }),
    PrismaModule,
    MailerConfigModule,
    AuthModule,
    UsersModule,
    MeModule,
    AppsModule,
    CategoriesModule,
    TagsModule,
    NotificationsModule,
    SettingModule,
    AdminUsersModule,
    AdminDeveloperRequestsModule,
    AdminAppsModule,
    AdminNotificationsModule,
    AdminPlansModule,
    AdminSettingModule,
    DeveloperModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {} 
