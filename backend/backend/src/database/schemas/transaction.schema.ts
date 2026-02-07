import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Wallet } from './wallet.schema';

export type TransactionDocument = mongoose.HydratedDocument<Transaction>;

// export enum TransactionType {
//   FUND = 'FUND',
//   TOPUP = 'TOPUP',
//   TRANSFER = 'TRANSFER',
//   REFUND = 'REFUND',
//   WITHDRAW = 'WITHDRAW',
//   PURCHASE = 'PURCHASE',
//   SUBSCRIPTION = 'SUBSCRIPTION',
//   TIP = 'TIP',
//   MENU_PURCHASE = 'MENU_PURCHASE',
//   MEDIA_PURCHASE = 'MEDIA_PURCHASE',
//   CALL_BOOKING = 'CALL_BOOKING',
// }

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  RESERVE = 'RESERVE',
  RELEASE = 'RELEASE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
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
export class Transaction {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true })
  wallet: mongoose.Types.ObjectId | Wallet;

  @Prop({ required: true, enum: TransactionType })
  type: TransactionType;

  // @Prop({ required: true, enum: Action })
  // action: TransactionType;

  @Prop({ required: true, enum: TransactionStatus })
  status: TransactionStatus;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ required: true })
  balanceBefore: number;

  @Prop({ required: true })
  balanceAfter: number;

  // @Prop({ required: true })
  // reference: string; // unique tx id

  // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  // sender?: mongoose.Types.ObjectId | User;

  // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  // receiver?: mongoose.Types.ObjectId | User;

  @Prop({ type: Object })
  meta?: Record<string, any>;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
// TransactionSchema.index({ user: 1, reference: 1 }, { unique: true });

// TransactionSchema.virtual('amountDollar').get(function () {
//   return this.amount / 100;
// });
