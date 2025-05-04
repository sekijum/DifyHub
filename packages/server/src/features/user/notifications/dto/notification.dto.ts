import { Notification, NotificationLevel } from '@prisma/client';

export class NotificationDto {
  id: number;
  title: string;
  content: string;
  level: NotificationLevel;
  startAt: Date;
  endAt: Date | null;
  isVisibleOnTop: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(entity: Notification) {
    this.id = entity.id;
    this.title = entity.title;
    this.content = entity.content;
    this.level = entity.level;
    this.startAt = entity.startAt;
    this.endAt = entity.endAt;
    this.isVisibleOnTop = entity.isVisibleOnTop;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }

  static fromEntity(entity: Notification): NotificationDto {
    return new NotificationDto(entity);
  }
} 
