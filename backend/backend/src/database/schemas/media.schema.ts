import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';
import { Post } from './post.schema';
import { Menu } from './menu.schema';

export type MediaDocument = mongoose.HydratedDocument<Media>;

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      // delete ret._id; // casing error for returns media in arrays
      delete ret.__v;
      return ret;
    },
  },
})
export class Media {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  public_id: string;

  @Prop({ required: true, enum: MediaType })
  type: string;

  @Prop()
  caption?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Post' })
  post?: mongoose.Schema.Types.ObjectId | Post;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Message' })
  chat?: mongoose.Schema.Types.ObjectId | Post;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Menu' })
  menu?: mongoose.Schema.Types.ObjectId | Menu;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  owner: mongoose.Schema.Types.ObjectId | User;

  @Prop({ required: true })
  uploadedAt: Date;
}

export const MediaSchema = SchemaFactory.createForClass(Media);
