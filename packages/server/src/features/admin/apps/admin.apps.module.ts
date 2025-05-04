import { Module } from '@nestjs/common';
import { AdminAppsController } from './admin.apps.controller';
import { AdminAppsService } from './admin.apps.service';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { MailerService } from '@/core/mailer/mailer.service';

@Module({
  controllers: [AdminAppsController],
  providers: [AdminAppsService, PrismaService, MailerService],
  exports: [AdminAppsService],
})
export class AdminAppsModule {} 
