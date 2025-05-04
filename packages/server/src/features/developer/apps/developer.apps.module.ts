import { Module } from '@nestjs/common';
import { DeveloperAppsController } from './developer.apps.controller';
import { DeveloperAppsService } from './developer.apps.service';
import { PrismaModule } from '@/core/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DeveloperAppsController],
  providers: [DeveloperAppsService],
  exports: [DeveloperAppsService],
})
export class DeveloperAppsModule {} 
