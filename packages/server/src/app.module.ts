import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { VideosModule } from './videos/videos.module';
import { CommentsModule } from './comments/comments.module';
import { ChannelsModule } from './channels/channels.module';
import { LikesModule } from './likes/likes.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    VideosModule,
    CommentsModule, 
    ChannelsModule,
    LikesModule,
    StorageModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 
