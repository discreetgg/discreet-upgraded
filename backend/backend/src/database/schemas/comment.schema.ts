import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';
import { Post } from './post.schema';

export type CommentDocument = mongoose.HydratedDocument<Comment>;

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
export class Comment {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  author: mongoose.Schema.Types.ObjectId | User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true })
  post: mongoose.Schema.Types.ObjectId | Post;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' })
  parentComment?: mongoose.Schema.Types.ObjectId | Comment; // for nested replies

  @Prop({ required: true })
  content: string;

  @Prop({ default: 0 }) // how many replies this comment has
  commentsCount: number;

  @Prop({ default: 0 })
  likesCount: number;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
