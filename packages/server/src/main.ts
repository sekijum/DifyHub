import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // グローバルパイプの設定
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORSの有効化
  app.enableCors();

  // Swaggerの設定
  const config = new DocumentBuilder()
    .setTitle('BondageZog API')
    .setDescription('YouTubeクローンアプリのAPI')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // サーバー起動
  await app.listen(3000);
  console.log(`アプリケーションは http://localhost:3000 で実行中です`);
}
bootstrap(); 
