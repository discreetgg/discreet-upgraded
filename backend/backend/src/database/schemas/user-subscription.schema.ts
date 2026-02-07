import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';
import { SubscriptionPlan } from './subscription-plan.schema';
import { Payment } from './payment.schema';

export type UserSubscriptionDocument =
  mongoose.HydratedDocument<UserSubscription>;

export enum SubscriptionStatus {
  ACTIVE = 'active', // User has an active subscription
  TRAILING = 'trialing', // User is in a free trial period/General
  CANCELED = 'canceled', // Subscription has been canceled
  PAST_DUE = 'past_due', // Payment failed or overdue
  PAUSED = 'paused', // Subscription is temporarily on hold
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
export class UserSubscription {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Types.ObjectId | User;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true,
  })
  plan: mongoose.Types.ObjectId | SubscriptionPlan;

  @Prop({ default: Date.now })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: true })
  isAutoRenew: boolean;

  @Prop({ type: Number, default: 1 })
  durationInMonths: number;

  @Prop({ default: 0 })
  renewCount: number;

  @Prop({
    enum: SubscriptionStatus,
    required: true,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' })
  lastPayment: mongoose.Schema.Types.ObjectId | Payment;

  @Prop({ type: Object })
  meta?: Record<string, any>;
}

export const UserSubscriptionSchema =
  SchemaFactory.createForClass(UserSubscription);

UserSubscriptionSchema.index({ user: 1 });
UserSubscriptionSchema.index({ plan: 1 });

// @Prop({ default: true })
// isAutoRenew: boolean;
