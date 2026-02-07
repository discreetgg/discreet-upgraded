import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';
import { Transaction } from './transaction.schema';

export type PaymentDocument = mongoose.HydratedDocument<Payment>;

export enum PaymentType {
  TIP = 'TIP',
  SUBSCRIPTION = 'SUBSCRIPTION',
  SUBSCRIPTION_RENEWAL = 'SUBSCRIPTION_RENEWAL',
  MENU_PURCHASE = 'MENU_PURCHASE',
  MEDIA_PURCHASE = 'MEDIA_PURCHASE',
  CALL_SESSION = 'CALL_SESSION',
}

export enum PaymentStatus {
  RESERVED = 'RESERVED', // money moved to reserved balance
  COMPLETED = 'COMPLETED',
  RELEASED = 'RELEASED',
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
export class Payment {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  payer: mongoose.Types.ObjectId | User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  receiver: mongoose.Types.ObjectId | User;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ required: true, enum: PaymentType })
  type: PaymentType;

  @Prop({ type: Object })
  meta?: Record<string, any>;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  })
  creditTx?: mongoose.Types.ObjectId | Transaction;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  })
  debitTx?: mongoose.Types.ObjectId | Transaction;

  // @Prop({
  //   type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
  //   default: [],
  // })
  // batchDebitTx?: mongoose.Types.ObjectId[];

  // @Prop({
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Transaction',
  //   required: true,
  // })
  // PlatformFeeTx: mongoose.Types.ObjectId | Transaction;

  @Prop({
    required: true,
    enum: PaymentStatus,
    default: PaymentStatus.RESERVED,
  })
  status: PaymentStatus;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
