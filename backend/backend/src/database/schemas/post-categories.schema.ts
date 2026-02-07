import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';

export type PostCategoryDocument = mongoose.HydratedDocument<PostCategory>;

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
export class PostCategory {
  @Prop({ default: false })
  general?: boolean;

  @Prop({ type: [String], default: [], required: true })
  categories: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  creator: mongoose.Schema.Types.ObjectId | User;
}

export const PostCategorySchema = SchemaFactory.createForClass(PostCategory);

//TODO: DELETE LATER
