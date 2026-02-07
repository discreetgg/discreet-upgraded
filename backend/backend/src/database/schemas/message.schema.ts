import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

import { Conversation } from './conversation.schema';
import { InMessageMedia } from './in-message-media.schema';

export type MessageDocument = mongoose.HydratedDocument<Message>;

export enum MessageType {
  TEXT = 'text',
  MEDIA = 'media',
  SYSTEM = 'system',
  MENU = 'menu',
  IN_MESSAGE_MEDIA = 'in_message_media',
  CALL = 'call',
}

export enum CallType {
  VIDEO = 'video',
  AUDIO = 'audio',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

export enum CallStatus {
  INITIATED = 'initiated', // when the caller starts ringing
  IN_WAITROOM = 'in_waitroom',
  ONGOING = 'ongoing', // when the call is answered
  ENDED = 'ended', // normal end
  MISSED = 'missed', // receiver didn't answer
  DECLINED = 'declined', // receiver rejected the call
}

@Schema({ timestamps: true })
export class Message {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  })
  conversation: mongoose.Schema.Types.ObjectId | Conversation;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  sender: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  reciever: mongoose.Schema.Types.ObjectId;

  @Prop({ enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Prop()
  text?: string;

  // @Prop({ type: String, required: false, enum: ['Media', 'MenuMedia'] })
  // mediaModel?: 'Media' | 'MenuMedia';

  // @Prop({
  //   type: [{ type: mongoose.Schema.Types.ObjectId, refPath: 'mediaModel' }],
  //   default: [],
  // })
  // media: mongoose.Schema.Types.ObjectId[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: [] }],
  })
  media: mongoose.Schema.Types.ObjectId[];

  @Prop({ default: false })
  isPayable?: boolean;

  @Prop()
  price?: string;

  @Prop({ default: false })
  paid?: boolean;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  })
  paymentTx?: mongoose.Schema.Types.ObjectId;

  @Prop({ enum: MessageStatus, default: MessageStatus.SENT })
  status: MessageStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Message' })
  replyTo?: mongoose.Schema.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InMessageMedia',
  })
  inMessageMedia?: mongoose.Schema.Types.ObjectId | InMessageMedia;

  // --- CALL FIELDS ---
  @Prop({ enum: CallType })
  call?: CallType;

  @Prop({ enum: CallStatus })
  callStatus?: CallStatus;

  @Prop()
  callStartedAt?: Date;

  @Prop()
  callEndedAt?: Date;

  @Prop()
  durationInSeconds?: number; // computed difference between start and end

  @Prop({ default: false })
  missed?: boolean; // true if receiver never answered

  // --- IN-MESSAGE-MEDIA FIELDS ---
  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop({ default: '0' })
  discount: string;

  @Prop({ default: 1 })
  itemCount: number;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversation: 1, createdAt: -1 });
