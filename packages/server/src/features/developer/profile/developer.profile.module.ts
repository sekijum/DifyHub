import { Module } from '@nestjs/common';
import { DeveloperProfileController } from './developer.profile.controller';
import { DeveloperProfileService } from './developer.profile.service';
import { PrismaModule } from '@/core/database/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [DeveloperProfileController],
  providers: [DeveloperProfileService],
  exports: [DeveloperProfileService],
})
export class DeveloperProfileModule {} 
