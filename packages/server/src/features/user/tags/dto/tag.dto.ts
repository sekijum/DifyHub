import { Tag } from '@prisma/client';

export class TagDto {
  id: number;
  name: string;
  appCount?: number; // オプショナルでアプリ数を含める

  constructor(partial: Partial<TagDto & Tag>) {
    this.id = partial.id;
    this.name = partial.name;
    this.appCount = partial.appCount;
  }

  // Prisma エンティティからマッピング
  static fromEntity(entity: Tag & { _count?: { apps: number } }): TagDto {
    const dto = new TagDto({
        ...entity,
        appCount: entity._count?.apps
    });
    return dto;
  }
} 
