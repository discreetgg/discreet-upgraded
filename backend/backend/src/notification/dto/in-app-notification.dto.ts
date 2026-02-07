import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export enum NotificationEntityType {
  Follow = 'Follow',
  MenuPurchase = 'MenuPurchase',
  Tip = 'Tip',
  Like = 'Like',
  Comment = 'Comment',
  MediaPurchase = 'MediaPurchase',
}

export class CreateNotificationDto {
  @IsString()
  user: string; // recipient

  @IsOptional()
  @IsString()
  sender?: string; // who triggered the event

  @IsOptional()
  @IsString()
  entityId?: string; // related post, comment, etc.

  @IsEnum(NotificationEntityType)
  entityType: NotificationEntityType;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
