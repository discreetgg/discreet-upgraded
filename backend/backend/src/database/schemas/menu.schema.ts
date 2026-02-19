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

export enum PromoType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export type Image = {
  url: string;
  public_id: string;
};

export type PreviewMedia = {
  url: string;
  public_id: string;
  type: 'image' | 'video';
};

@Schema({ _id: false })
export class MenuPromo {
  @Prop({ default: false })
  isEnabled: boolean;

  @Prop({
    type: String,
    enum: Object.values(PromoType),
    default: PromoType.PERCENTAGE,
  })
  type: PromoType;

  @Prop({ type: String, default: '0' })
  value: string;

  @Prop({ type: Date, default: null })
  startsAt: Date | null;

  @Prop({ type: Date, default: null })
  endsAt: Date | null;

  @Prop({ type: String, default: '' })
  message: string;
}

export const MenuPromoSchema = SchemaFactory.createForClass(MenuPromo);

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      (ret as any).id = ret._id.toString();
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
  imageCount: number;

  @Prop({ default: 0 })
  videoCount: number;

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
    type: MenuPromoSchema,
    default: () => ({
      isEnabled: false,
      type: PromoType.PERCENTAGE,
      value: '0',
      startsAt: null,
      endsAt: null,
      message: '',
    }),
  })
  promo: MenuPromo;

  @Prop({
    type: {
      url: String,
      public_id: String,
    },
  })
  coverImage: Image;

  @Prop({
    type: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        type: { type: String, enum: ['image', 'video'], required: true },
      },
    ],
    default: [],
  })
  previewMedia: PreviewMedia[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  owner: mongoose.Schema.Types.ObjectId | User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null })
  sourcePost: mongoose.Types.ObjectId | null;

  @Prop({ default: false })
  isArchived: boolean;
}

export const MenuSchema = SchemaFactory.createForClass(Menu);
MenuSchema.index({ owner: 1 });
