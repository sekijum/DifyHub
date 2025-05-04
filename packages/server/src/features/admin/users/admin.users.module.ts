import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin.users.controller';
import { AdminUsersService } from './admin.users.service';
import { PrismaModule } from '@/core/database/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
})
export class AdminUsersModule {}
