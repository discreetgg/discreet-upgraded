import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';

export type ServerDocument = mongoose.HydratedDocument<Server>;

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
export class Server {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  creator: mongoose.Schema.Types.ObjectId | User;

  @Prop({ required: true })
  guildId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  link: string;

  @Prop({ required: true })
  bio: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 0 })
  likesCount: number;

  @Prop()
  customName: string;

  @Prop({ default: 0 })
  activeMemberCount: number;

  @Prop({ default: 0 })
  totalMemberCount: number;

  @Prop()
  icon: string;

  @Prop()
  referralCode: string;
}

export const ServerSchema = SchemaFactory.createForClass(Server);
