import { Module } from '@nestjs/common';
import { AdminDeveloperRequestsController } from './admin.developer-requests.controller';
import { AdminDeveloperRequestsService } from './admin.developer-requests.service';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { MailerService } from '@/core/mailer/mailer.service';

@Module({
  controllers: [AdminDeveloperRequestsController],
  providers: [AdminDeveloperRequestsService, PrismaService, MailerService],
  exports: [AdminDeveloperRequestsService],
})
export class AdminDeveloperRequestsModule {} 
