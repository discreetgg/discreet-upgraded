import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';

export type WalletDocument = mongoose.HydratedDocument<Wallet>;

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
export class Wallet {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Types.ObjectId | User;

  @Prop({ default: 0 }) // in cent (100 = $1.00)  i.e. the lowest value of USD
  balance: number;

  @Prop({ default: 0 })
  reservedBalance: number; // for pending debits

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
