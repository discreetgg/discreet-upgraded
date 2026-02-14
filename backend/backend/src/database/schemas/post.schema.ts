import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';
import { SubscriptionPlan } from './subscription-plan.schema';
import { Category } from './category.schema';
import { Menu } from './menu.schema';

export type PostDocument = mongoose.HydratedDocument<Post>;

export enum Visibility {
  GENERAL = 'general',
  PAID_MEMBERS = 'paid_members',
  // SUBSCRIBERS = 'subscribers', // all subscribers
  CUSTOM_PLAN = 'custom_plan', // for custom made subscribers
}

export enum PostUnlockableType {
  NONE = 'none',
  SINGLE = 'single',
  BUNDLE = 'bundle',
}

export type ScheduledPost = {
  isScheduled: boolean;
  scheduledFor: Date | null;
};

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
export class Post {
  @Prop()
  title: string;

  @Prop()
  content: string;

  @Prop({ enum: Visibility, default: Visibility.GENERAL })
  visibility: Visibility;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' })
  visibleToPlan: mongoose.Schema.Types.ObjectId | SubscriptionPlan;

  @Prop({ type: String, default: '0' })
  priceToView: string;

  @Prop({
    type: String,
    enum: Object.values(PostUnlockableType),
    default: PostUnlockableType.NONE,
  })
  unlockableType: PostUnlockableType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Menu', default: null })
  linkedMenu: mongoose.Schema.Types.ObjectId | Menu | null;

  @Prop({ default: false })
  tippingEnabled: boolean;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  })
  category: mongoose.Schema.Types.ObjectId | Category;

  @Prop({
    type: {
      isScheduled: { type: Boolean, default: false },
      scheduledFor: { type: Date, default: null },
    },
    default: { isScheduled: false, scheduledFor: null },
  })
  scheduledPost: ScheduledPost;

  @Prop({ default: false })
  isDraft: boolean;

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  commentsCount: number;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  bookmarksCount: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  author: mongoose.Schema.Types.ObjectId | User;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: [] }],
  })
  media: mongoose.Schema.Types.ObjectId[];
}

export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.index({ author: 1 });
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ visibility: 1, createdAt: -1 });
PostSchema.index({ category: 1, createdAt: -1 });
