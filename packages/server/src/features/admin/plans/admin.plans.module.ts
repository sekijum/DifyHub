import { Module } from '@nestjs/common';
import { AdminPlansController } from './admin.plans.controller';
import { AdminPlansService } from './admin.plans.service';
import { PrismaModule } from '@/core/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminPlansController],
  providers: [AdminPlansService],
  exports: [AdminPlansService],
})
export class AdminPlansModule {} 
