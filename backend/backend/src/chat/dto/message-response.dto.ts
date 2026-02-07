import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Conversation } from 'src/database/schemas/conversation.schema';
import { Media } from 'src/database/schemas/media.schema';
import {
  Message,
  MessageStatus,
  MessageType,
} from 'src/database/schemas/message.schema';
import { User } from 'src/database/schemas/user.schema';

export class MessageResponseDto {
  @ApiProperty({
    description: 'chat conversation',
    type: Conversation,
  })
  conversation: Conversation;

  @ApiProperty({
    description: 'message sender',
    type: User,
  })
  sender: User;

  @ApiProperty({
    description: 'message reciever',
    type: User,
  })
  reciever: User;

  @ApiProperty({
    enum: MessageType,
  })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiPropertyOptional({ description: 'Text content of the message' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiProperty({
    description: 'message media',
    type: [Media],
  })
  media: Media[];

  @ApiProperty({
    enum: MessageStatus,
  })
  @IsEnum(MessageStatus)
  status: MessageStatus;

  @ApiProperty({
    description: 'message replied to',
    type: Message,
  })
  replyTo: Message;

  @ApiProperty({ description: 'message Id' })
  @IsString()
  _id: string;

  @ApiProperty({ description: 'date when message was sent' })
  @IsString()
  createdAt: Date;

  @ApiProperty({ description: 'date when message was updated' })
  @IsString()
  updatedAt: Date;
}
