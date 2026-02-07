import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';

export type SubscriptionPlanDocument =
  mongoose.HydratedDocument<SubscriptionPlan>;

// export enum PlanType {
//   ONETIME = 'onetime',
//   TIER = 'tier',
// }

export enum DurationType {
  MONTHLY = 'monthly',
}

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
export class SubscriptionPlan {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  amount: string;

  @Prop()
  description: string;

  @Prop()
  icon: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  creator: mongoose.Schema.Types.ObjectId | User;

  // @Prop({ enum: PlanType, default: PlanType.TIER })
  // type: PlanType;

  @Prop({ enum: DurationType, default: DurationType.MONTHLY })
  duration: DurationType;

  @Prop({ default: 0 })
  subscribersCount: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: false })
  isArchived: boolean;
}

export const SubscriptionPlanSchema =
  SchemaFactory.createForClass(SubscriptionPlan);
SubscriptionPlanSchema.index({ isArchived: 1, isDeleted: 1 });
SubscriptionPlanSchema.index({ creator: 1 });
