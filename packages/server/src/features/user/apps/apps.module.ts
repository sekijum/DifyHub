import { Module } from '@nestjs/common';
import { AppsController } from './apps.controller';
import { AppsService } from './apps.service';
import { PrismaModule } from '@/core/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule], // PrismaService を利用可能にするために PrismaModule をインポート
  controllers: [AppsController],
  providers: [AppsService],
})
export class AppsModule {} 
