import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';

export type LikeDocument = mongoose.HydratedDocument<Like>;

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
export class Like {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Types.ObjectId | User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  targetId: mongoose.Schema.Types.ObjectId;

  @Prop({
    type: String,
    enum: ['Post', 'Comment', 'Server'],
    required: true,
  })
  targetType: 'Post' | 'Comment' | 'Server';
}

export const LikeSchema = SchemaFactory.createForClass(Like);

// Prevent same user from liking the same thing multiple times
LikeSchema.index({ user: 1, targetId: 1, targetType: 1 }, { unique: true });

//Polymorphic Version
