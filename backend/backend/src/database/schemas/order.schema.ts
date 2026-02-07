import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';
import { Payment } from './payment.schema';

export type OrderDocument = mongoose.HydratedDocument<Order>;

// export enum ItemType {
//   MENU = 'Menu',
//   MEDIA = 'Media',
//   SUBSCRIPTION_PLAN = 'SubscriptionPlan',
//   CAM = 'Cam',
// }

export enum PaymentMethod {
  WALLET = 'WALLET',
  CARD = 'CARD',
  EXTERNAL = 'EXTERNAL',
}

export enum OrderStatus {
  // CREATED = 'CREATED',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
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
export class Order {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  buyer: mongoose.Types.ObjectId | User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  seller: mongoose.Types.ObjectId | User;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ type: Object })
  meta: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' })
  payment?: mongoose.Schema.Types.ObjectId | Payment;

  @Prop({ required: true, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ required: true, enum: PaymentMethod, default: PaymentMethod.WALLET })
  paymentMethod: PaymentMethod;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
