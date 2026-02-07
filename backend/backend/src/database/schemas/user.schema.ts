import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type UserDocument = mongoose.HydratedDocument<User>;

export enum Role {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin',
}

export type Image = {
  url: string;
  public_id: string;
  uploadedAt: Date;
};

export type Notification = {
  enabled: boolean;
  newFollower: boolean;
  newComment: boolean;
  newLike: boolean;
  newSubscriber: boolean;
  tip: boolean;
};

export type OtpData = {
  url: string;
  base32: string;
};

// export enum Race {
//   AFRICAN_BLACK = 'african/black',
//   ASIAN = 'asian',
//   WHITE_CAUCASIAN = 'white/caucasian',
//   HISPANIC_LATINO = 'hispanic/latino',
//   INDIGENOUS_NATIVE = 'indigenous/native',
//   PACIFIC_ISLANDER = 'pacific islander',
//   MIXED_RACE = 'mixed race',
// }

export enum Race {
  AFRICAN_BLACK = 'african_black',
  ASIAN = 'asian',
  WHITE_CAUCASIAN = 'white_caucasian',
  HISPANIC_LATINO = 'hispanic_latino',
  INDIGENOUS_NATIVE = 'indigenous_native',
  PACIFIC_ISLANDER = 'pacific_islander',
  MIXED_RACE = 'mixed_race',
}

@Schema({
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class User {
  @Prop({ unique: true, required: true })
  discordId: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  discordDisplayName: string;

  @Prop({ default: true })
  isUsingDiscordName: boolean;

  @Prop({ required: true })
  displayName: string;

  @Prop()
  discordAvatar: string;

  @Prop({ enum: Role, required: true, default: Role.BUYER })
  role: Role;

  @Prop({ default: '' })
  bio: string;

  @Prop({ default: false })
  isAgeVerified: boolean;

  @Prop({
    type: {
      url: String,
      public_id: String,
      uploadedAt: Date,
    },
  })
  profileImage: Image;

  @Prop({
    type: {
      url: String,
      public_id: String,
      uploadedAt: Date,
    },
  })
  profileBanner: Image;

  @Prop({
    type: {
      enabled: Boolean,
      newFollower: Boolean,
      newComment: Boolean,
      newLike: Boolean,
      newSubscriber: Boolean,
      tip: Boolean,
    },
    default: {
      enabled: false,
      newFollower: false,
      newComment: false,
      newLike: false,
      newSubscriber: false,
      tip: false,
    },
  })
  discordNotification: Notification;

  @Prop({
    type: {
      enabled: Boolean,
      newSubscriber: Boolean,
      tip: Boolean,
    },
    default: {
      enabled: false,
      newSubscriber: false,
      tip: false,
    },
  })
  emailNotification: Pick<Notification, 'enabled' | 'newSubscriber' | 'tip'>;

  @Prop({
    type: {
      enabled: Boolean,
      newFollower: Boolean,
      newComment: Boolean,
      newLike: Boolean,
      newSubscriber: Boolean,
      tip: Boolean,
    },
    default: {
      enabled: true,
      newFollower: true,
      newComment: true,
      newLike: true,
      newSubscriber: true,
      tip: true,
    },
  })
  inAppNotification: Notification;

  @Prop({ default: false })
  hasAuthPin: boolean;

  @Prop()
  hashedPin: string;

  @Prop({ default: false })
  _2FAEnabled: boolean;

  @Prop({ default: false })
  _2FAVerified: boolean;

  @Prop({ type: { url: String, base32: String } })
  _2FAData: OtpData;

  @Prop({ type: [String], default: [] })
  backupCodes: string[];

  @Prop({ default: 0 })
  followerCount: number;

  @Prop({ default: 0 })
  followingCount: number;

  @Prop({ enum: Race })
  race: Race;

  @Prop()
  callRate: number;

  @Prop() // minimum call time in mins
  minimumCallTime: number;

  @Prop({ default: false })
  takingCams: boolean;

  @Prop({ default: false })
  takingCalls: boolean;

  @Prop({ default: false })
  isGuest: boolean;

  @Prop()
  hashedPassword: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: false })
  isArchived: boolean;

  @Prop({ default: false })
  isBanned: boolean;

  @Prop()
  banReason: string;

  @Prop()
  bannedAt: Date;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
