import { MailerModule } from "@nestjs-modules/mailer";
import { Module } from "@nestjs/common";
import { MailerService } from "./mailer.service";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule], // ConfigModuleをインポートして環境変数を使えるようにする
      useFactory: async () => ({
        transport: {
          host: process.env.MAIL_HOST, // デフォルトを 'mailpit' に変更
          port: process.env.MAIL_PORT, // .env から取得、なければ 1025 (mailpit)
          secure: false, // 明示的に false を設定
          ignoreTLS: true, // TLS を無視するオプションを追加
          auth: {
            user: process.env.MAIL_USER, // .env から取得
            pass: process.env.MAIL_PASSWORD, // .env から取得
          },
          // ローカル開発で自己署名証明書を使う場合など
          // tls: {
          //   rejectUnauthorized: false,
          // },
        },
        defaults: {
          from: process.env.MAIL_FROM_ADDRESS, // デフォルトの送信元
        },
      }),
    }),
    ConfigModule, // useFactory で ConfigService を使うために必要
  ],
  providers: [MailerService],
  exports: [MailerService], // 他のモジュールで使えるようにエクスポート
})
export class MailerConfigModule {}
