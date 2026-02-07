import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';
import { Category } from './category.schema';

// import { MenuMedia } from './menu-media.schema';

export type MenuDocument = mongoose.HydratedDocument<Menu>;

export enum CollectionType {
  SINGLE = 'single',
  BUNDLES = 'bundles',
}

export type Image = {
  url: string;
  public_id: string;
};

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
export class Menu {
  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop({ type: String, default: '0' })
  priceToView: string;

  @Prop({ default: '0' })
  discount: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  category: mongoose.Schema.Types.ObjectId | Category;

  @Prop({ default: 1 })
  itemCount: number;

  @Prop({ default: 0 })
  itemSold: number;

  @Prop({ default: true })
  canBeUpdated: boolean;

  @Prop({ enum: CollectionType, default: CollectionType.SINGLE })
  collectionType: CollectionType;

  @Prop([
    { type: mongoose.Schema.Types.ObjectId, ref: 'MenuMedia', default: [] },
  ])
  media: mongoose.Schema.Types.ObjectId[];

  @Prop({ default: '' })
  noteToBuyer: string;

  @Prop({
    type: {
      url: String,
      public_id: String,
    },
  })
  coverImage: Image;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  owner: mongoose.Schema.Types.ObjectId | User;

  @Prop({ default: false })
  isArchived: boolean;
}

export const MenuSchema = SchemaFactory.createForClass(Menu);
MenuSchema.index({ owner: 1 });
