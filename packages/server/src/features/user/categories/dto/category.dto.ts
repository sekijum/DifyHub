import { Category } from '@prisma/client';

export class CategoryDto {
  id: number;
  name: string;
  appCount?: number; // オプショナルでアプリ数を含める

  constructor(partial: Partial<CategoryDto & Category>) {
    this.id = partial.id;
    this.name = partial.name;
    this.appCount = partial.appCount;
  }

  // Prisma エンティティからマッピング
  static fromEntity(entity: Category & { _count?: { apps: number } }): CategoryDto {
    const dto = new CategoryDto({
        ...entity,
        appCount: entity._count?.apps
    });
    return dto;
  }
} 
