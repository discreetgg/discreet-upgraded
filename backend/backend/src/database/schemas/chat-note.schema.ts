import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type ChatNoteDocument = mongoose.HydratedDocument<ChatNote>;

@Schema({ timestamps: true })
export class ChatNote {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  seller: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  buyer: mongoose.Schema.Types.ObjectId;

  @Prop()
  note: string;
}

export const ChatNoteSchema = SchemaFactory.createForClass(ChatNote);
