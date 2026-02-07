import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';

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
export class MenuMedia {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: true })
  media: mongoose.Schema.Types.ObjectId;

  @Prop({ default: false })
  sold: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  buyer: mongoose.Schema.Types.ObjectId | User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null })
  payment: mongoose.Schema.Types.ObjectId;

  @Prop({ type: Object })
  meta?: Record<string, any>;
}

export const MenuMediaSchema = SchemaFactory.createForClass(MenuMedia);
MenuMediaSchema.index({ menu: 1 });
MenuMediaSchema.index({ buyer: 1 });
// MenuMediaSchema.index({ media: 1, menu: 1 }, { unique: true }); // Prevent duplicate links
