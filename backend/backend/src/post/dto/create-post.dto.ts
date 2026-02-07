import {
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Visibility } from 'src/database/schemas/post.schema';

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
    description: 'Id of the category from sellers menu',
  })
  @IsOptional()
  @IsString()
  category: string;

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
