import {
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  IsBoolean,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PostUnlockableType,
  Visibility,
} from 'src/database/schemas/post.schema';

export class MediaMetaDto {
  @ApiPropertyOptional({ enum: ['image', 'video'] })
  @IsEnum(['image', 'video'])
  type?: 'image' | 'video';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caption?: string;
}

export class ScheduledPostDto {
  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isScheduled: boolean;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  scheduledFor?: Date;
}

export class CreatePostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(560)
  content: string;

  @ApiProperty({ enum: Visibility, default: Visibility.GENERAL })
  @IsEnum(Visibility)
  visibility: Visibility;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visibleToPlan: string;

  @ApiPropertyOptional({ example: '50' })
  @IsOptional()
  @IsString()
  priceToView: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  tippingEnabled: boolean;

  @ApiPropertyOptional({
    example: '62828772277722',
    description: 'Menu category ID used for unlockable post listing',
  })
  @IsOptional()
  @IsString()
  category: string;

  @ApiPropertyOptional({
    enum: PostUnlockableType,
    default: PostUnlockableType.NONE,
    description: 'Publish unlockable media to seller menu as single or bundle',
  })
  @IsOptional()
  @IsEnum(PostUnlockableType)
  unlockableType?: PostUnlockableType;

  @ApiPropertyOptional({
    description: 'Optional title override for the linked menu listing',
    example: 'Holiday Bundle 2026',
  })
  @IsOptional()
  @IsString()
  menuTitle?: string;

  @ApiPropertyOptional({
    description: 'Optional note delivered to buyer with unlocked content',
    example: 'Thanks for unlocking this drop.',
  })
  @IsOptional()
  @IsString()
  noteToBuyer?: string;

  @ApiPropertyOptional({ type: ScheduledPostDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScheduledPostDto)
  scheduledPost: ScheduledPostDto;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDraft: boolean;

  @ApiPropertyOptional({
    type: [MediaMetaDto],
    description: 'Array of media metadata',
    example: [
      { type: 'image', caption: 'An image caption' },
      { type: 'video', caption: 'A video caption' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaMetaDto)
  mediaMeta?: MediaMetaDto[];
}
