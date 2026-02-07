import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';

export type NotificationDocument = mongoose.HydratedDocument<Notification>;

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
export class Notification {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Types.ObjectId | User; // recipient

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  sender: mongoose.Types.ObjectId | User; // who triggered the event

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  entityId: mongoose.Schema.Types.ObjectId;

  @Prop({
    type: String,
    enum: ['Follow', 'MenuPurchase', 'Tip', 'Like', 'Comment', 'MediaPurchase'],
    required: true,
  })
  entityType:
    | 'Follow'
    | 'MenuPurchase'
    | 'Tip'
    | 'Like'
    | 'Comment'
    | 'MediaPurchase';

  @Prop()
  message: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ default: false })
  isRead: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
