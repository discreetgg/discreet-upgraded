import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';
import { Post } from './post.schema';

export type BookmarkDocument = mongoose.HydratedDocument<Bookmark>;

@Schema({ timestamps: true })
export class Bookmark {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Schema.Types.ObjectId | User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true })
  post: mongoose.Schema.Types.ObjectId | Post;
}

export const BookmarkSchema = SchemaFactory.createForClass(Bookmark);

// Prevent duplicate bookmarks (unique pair)
BookmarkSchema.index({ user: 1, post: 1 }, { unique: true });
