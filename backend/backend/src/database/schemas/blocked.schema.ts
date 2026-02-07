import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';

export type BlockDocument = mongoose.HydratedDocument<Block>;

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
export class Block {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  blocker: mongoose.Types.ObjectId | User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  blocked: mongoose.Types.ObjectId | User;
}

export const BlockSchema = SchemaFactory.createForClass(Block);

BlockSchema.index({ blocker: 1 });
BlockSchema.index({ blocked: 1 });
BlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });
