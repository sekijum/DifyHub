import { Module, ValidationPipe } from "@nestjs/common";
import { APP_PIPE, APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { MailerConfigModule } from "./core/mailer/mailer.module";
import { MeModule } from "./features/me/me.module";
import { UserModule } from "./features/user/user.module";
import { AdminModule } from "./features/admin/admin.module";
import { DeveloperModule } from "./features/developer/developer.module";

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: () => {
        return [
          {
            ttl: 60000,
            limit: 100,
          },
        ];
      },
    }),
    MailerConfigModule,
    MeModule,
    UserModule,
    AdminModule,
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
