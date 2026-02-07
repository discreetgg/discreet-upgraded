import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';

export type CategoryDocument = mongoose.HydratedDocument<Category>;

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
export class Category {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  owner: mongoose.Schema.Types.ObjectId | User;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true, unique: true })
  normalizedCategory: string;

  @Prop({ required: true })
  hashtag: string;

  @Prop({ default: 0 })
  usageCount: number;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
