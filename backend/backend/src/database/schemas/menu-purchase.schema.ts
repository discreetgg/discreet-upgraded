import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Menu } from './menu.schema';
import { User } from './user.schema';
import { Payment } from './payment.schema';

export type MenuPurchaseDocument = mongoose.HydratedDocument<MenuPurchase>;

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
export class MenuPurchase {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true })
  menu: mongoose.Schema.Types.ObjectId | Menu;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  buyer: mongoose.Schema.Types.ObjectId | User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' })
  payment?: mongoose.Schema.Types.ObjectId | Payment;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: Object })
  meta?: Record<string, any>;
}
export const MenuPurchaseSchema = SchemaFactory.createForClass(MenuPurchase);
MenuPurchaseSchema.index({ buyer: 1 });
