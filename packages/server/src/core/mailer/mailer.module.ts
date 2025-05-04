import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule], // ConfigModuleをインポートして環境変数を使えるようにする
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST', 'mailpit'), // デフォルトを 'mailpit' に変更
          port: config.get('MAIL_PORT', 1025), // .env から取得、なければ 1025 (mailpit)
          secure: false, // 明示的に false を設定
          ignoreTLS: true, // TLS を無視するオプションを追加
          auth: {
            user: config.get('MAIL_USER'), // .env から取得
            pass: config.get('MAIL_PASSWORD'), // .env から取得
          },
          // ローカル開発で自己署名証明書を使う場合など
          // tls: {
          //   rejectUnauthorized: false,
          // },
        },
        defaults: {
          from: `"${config.get('MAIL_FROM_NAME', 'DifyHub')}" <${config.get(
            'MAIL_FROM_ADDRESS',
            'noreply@example.com',
          )}>`, // デフォルトの送信元
        },
      }),
    }),
    ConfigModule, // useFactory で ConfigService を使うために必要
  ],
  providers: [MailerService],
  exports: [MailerService], // 他のモジュールで使えるようにエクスポート
})
export class MailerConfigModule {} 
