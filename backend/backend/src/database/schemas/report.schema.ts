import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';

export type ReportDocument = mongoose.HydratedDocument<Report>;

export enum ReportTargetType {
  USER = 'User',
  POST = 'Post',
  COMMENT = 'Comment',
}

export enum ReportReason {
  HATE = 'HATE',
  ABUSE_HARASSMENT = 'ABUSE_HARASSMENT',
  VIOLENCE_SPEECH = 'VIOLENCE_SPEECH',
  CHILD_SAFETY = 'CHILD_SAFETY',
  ILLEGAL_REGULATED_BEHAVIORS = 'ILLEGAL_REGULATED_BEHAVIORS',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  ACTION_TAKEN = 'ACTION_TAKEN',
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
export class Report {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  reporter: mongoose.Schema.Types.ObjectId | User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  targetId: mongoose.Schema.Types.ObjectId;

  @Prop({ enum: ReportTargetType, required: true })
  targetType: ReportTargetType;

  @Prop({ default: null })
  reasonDescription: string;

  @Prop({ enum: ReportReason })
  reason: ReportReason;

  @Prop({ enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Prop({ default: null })
  moderatorComment?: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
