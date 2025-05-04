import { Module } from '@nestjs/common';
import { AdminNotificationsController } from './admin.notifications.controller';
import { AdminNotificationsService } from './admin.notifications.service';
import { PrismaService } from '@/core/database/prisma/prisma.service';

@Module({
  controllers: [AdminNotificationsController],
  providers: [AdminNotificationsService, PrismaService],
  exports: [AdminNotificationsService],
})
export class AdminNotificationsModule {} 
