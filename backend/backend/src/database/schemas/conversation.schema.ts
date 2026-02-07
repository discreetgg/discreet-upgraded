import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type ConversationDocument = mongoose.HydratedDocument<Conversation>;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Conversation {
  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'User', required: true })
  participants: mongoose.Schema.Types.ObjectId[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  })
  lastMessage?: mongoose.Schema.Types.ObjectId;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
