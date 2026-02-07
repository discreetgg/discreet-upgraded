import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';

// import { MenuMedia } from './menu-media.schema';

export type InMessageMediaDocument = mongoose.HydratedDocument<InMessageMedia>;

export type Media = {
  url: string;
  public_id: string;
  video: string;
};

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
export class InMessageMedia {
  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop({ type: String, default: '0' })
  priceToView: string;

  @Prop({ default: '0' })
  discount: string;

  @Prop({ default: 1 })
  itemCount: number;

  //   @Prop({ default: true })
  //   canBeUpdated: boolean;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: [] }])
  media: mongoose.Schema.Types.ObjectId[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  sender: mongoose.Schema.Types.ObjectId | User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  reciever: mongoose.Schema.Types.ObjectId | User;

  //   @Prop({ default: false })
  //   isArchived: boolean;
}

export const InMessageMediaSchema =
  SchemaFactory.createForClass(InMessageMedia);
