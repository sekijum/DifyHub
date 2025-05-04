import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
// PrismaModule をインポートして PrismaService を利用可能にする (AppModule などでグローバルに提供されている場合は不要な場合もある)
// import { PrismaModule } from '@/core/database/prisma/prisma.module';

@Module({
  // imports: [PrismaModule], // 必要に応じてインポート
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {} 
