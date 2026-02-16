import { BadRequestException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  MessagePurchaseType,
  MessageStatus,
  MessageType,
  PurchaseOriginSurface,
} from 'src/database/schemas/message.schema';
import { MediaMetaDto } from 'src/post/dto/create-post.dto';

export class MessageMediaMetaDto {
  @ApiPropertyOptional({ enum: ['image', 'video'] })
  @IsEnum(['image', 'video'])
  type?: 'image' | 'video';

  //   @ApiPropertyOptional({ description: 'Optional caption for media' })
  //   @IsOptional()
  //   @IsString()
  //   caption?: string;
}

export class CreateMessageWithMediaDto {
  @ApiPropertyOptional({
    description: 'Conversation ID',
    example: '64d2f5bd7c5a1a44a0ef1234',
    type: String,
  })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({
    description: 'DiscordId of the sender',
    example: '1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  sender: string;

  @ApiProperty({
    description: 'DiscordId of the receiver',
    example: '9876543210',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  reciever: string;

  @ApiProperty({
    enum: MessageType,
    default: MessageType.MEDIA,
  })
  @IsEnum(MessageType)
  type: MessageType.MEDIA;

  @ApiProperty({
    default: false,
  })
  isPayable: boolean;

  @ApiPropertyOptional({ description: 'price to view media' })
  @IsOptional()
  @IsString()
  price?: string;

  @ApiPropertyOptional({ description: 'Text content of the message' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    type: [MessageMediaMetaDto],
    description: 'Array of media metadata',
    example: [{ type: 'image' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageMediaMetaDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      // If it's already wrapped in [] → parse directly
      if (value.trim().startsWith('[')) {
        return JSON.parse(value);
      }

      // If it's comma-separated objects without []
      return JSON.parse(`[${value}]`);
    }
    return value;
  })
  mediaMeta?: MessageMediaMetaDto[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Attached media files (image/video)',
  })
  @IsOptional()
  files?: Express.Multer.File[];

  @ApiProperty({
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  @IsEnum(MessageStatus)
  status: MessageStatus;

  @ApiPropertyOptional({
    description: 'Id of the message being replied to',
    example: '64d2f5bd7c5a1a44a0ef1234',
  })
  @IsOptional()
  @IsString()
  replyTo?: string;
}

export class CreateMessageWithoutMediaDto {
  @ApiPropertyOptional({
    description: 'Conversation ID',
    example: '64d2f5bd7c5a1a44a0ef1234',
    type: String,
  })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({
    description: 'DiscordId of the sender',
    example: '1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  sender: string;

  @ApiProperty({
    description: 'DiscordId of the receiver',
    example: '9876543210',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  reciever: string;

  @ApiPropertyOptional({ description: 'Text content of the message' })
  @IsString()
  text: string;

  @ApiProperty({
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  @IsEnum(MessageStatus)
  status: MessageStatus;

  @ApiPropertyOptional({
    description: 'Id of the message being replied to',
    example: '64d2f5bd7c5a1a44a0ef1234',
  })
  @IsOptional()
  @IsString()
  replyTo?: string;
}

export class MessagePurchaseContextDto {
  @ApiPropertyOptional({
    enum: PurchaseOriginSurface,
    default: PurchaseOriginSurface.UNKNOWN,
  })
  @IsOptional()
  @IsEnum(PurchaseOriginSurface)
  originSurface?: PurchaseOriginSurface;

  @ApiPropertyOptional({
    description: 'Source post id for purchase provenance',
  })
  @IsOptional()
  @IsString()
  sourcePostId?: string;

  @ApiPropertyOptional({
    description: 'Source menu id for purchase provenance',
  })
  @IsOptional()
  @IsString()
  sourceMenuId?: string;

  @ApiPropertyOptional({
    description: 'Source conversation id for purchase provenance',
  })
  @IsOptional()
  @IsString()
  sourceConversationId?: string;

  @ApiPropertyOptional({
    description: 'Source message id for purchase provenance',
  })
  @IsOptional()
  @IsString()
  sourceMessageId?: string;

  @ApiPropertyOptional({ description: 'Readable source label' })
  @IsOptional()
  @IsString()
  sourceLabel?: string;

  @ApiPropertyOptional({
    enum: MessagePurchaseType,
    description: 'Type of purchase represented by this message',
  })
  @IsOptional()
  @IsEnum(MessagePurchaseType)
  purchaseType?: MessagePurchaseType;
}

export class CreateMessageMenuDto {
  @ApiProperty({
    description: 'id of the sender',
    example: '1234567890',
    type: String,
  })
  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  sender: string;

  @ApiProperty({
    description: 'id of the receiver',
    example: '9876543210',
    type: String,
  })
  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  reciever: string;

  @ApiProperty({ description: 'Media content of the menu' })
  @IsArray()
  media: string[];

  @ApiPropertyOptional({ description: 'Text content of the message' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ description: 'Price of menu' })
  @Type(() => String)
  @IsString()
  price: string;

  @ApiPropertyOptional({ description: 'payment transaction of menu' })
  @Type(() => String)
  @IsString()
  paymentTx: string;

  @ApiPropertyOptional({
    description: 'Whether this message should use payable media presentation',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPayable?: boolean;

  @ApiPropertyOptional({
    description: 'Whether buyer already paid for this media bundle',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @ApiPropertyOptional({ description: 'Menu bundle title' })
  @IsOptional()
  @Type(() => String)
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Menu bundle description' })
  @IsOptional()
  @Type(() => String)
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Optional message id being referenced',
  })
  @IsOptional()
  @Type(() => String)
  @IsString()
  replyTo?: string;

  @ApiPropertyOptional({
    description: 'Structured purchase provenance payload',
    type: MessagePurchaseContextDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MessagePurchaseContextDto)
  purchaseContext?: MessagePurchaseContextDto;
}

export class CreateInMessageMediaDto {
  @ApiProperty({
    description: 'DiscordId of the sender',
    example: '1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  sender: string;

  @ApiProperty({
    description: 'discordId of the receiver',
    example: '9876543210',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  reciever: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ example: '50' })
  @Type(() => String)
  @IsString()
  priceToView: string;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  @Type(() => String)
  @IsString()
  discount?: string;

  @ApiPropertyOptional({
    type: [MediaMetaDto],
    description: 'Array of media metadata',
    example: [
      { type: 'image', caption: 'preview' },
      { type: 'image', caption: 'content image' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaMetaDto)
  @Transform(({ value }) => {
    if (!value) return undefined;

    // If already an array, return directly
    if (Array.isArray(value)) return value;

    // If sent as string, try to parse it
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        throw new BadRequestException('mediaMeta must be valid JSON array');
      }
    }

    // Fallback
    return value;
  })
  mediaMeta?: MediaMetaDto[];
}
