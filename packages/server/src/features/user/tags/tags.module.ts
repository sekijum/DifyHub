import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
// import { PrismaModule } from '@/core/database/prisma/prisma.module';

@Module({
  // imports: [PrismaModule],
  controllers: [TagsController],
  providers: [TagsService],
})
export class TagsModule {} 
