import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { Image, Role, Notification } from 'src/database/schemas/user.schema';

export class UserResponseDto {
  @Expose()
  discordId: string;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  displayName: string;

  @Expose()
  discordAvatar: string;

  @Expose()
  discordDisplayName: string;

  @Expose()
  role: Role;

  @Expose()
  isAgeVerified: boolean;

  @Expose()
  bio: string;

  @Expose()
  profileImage: Image;

  @Expose()
  profileBanner: Image;

  @Expose()
  discordNotification: Notification;

  @Expose()
  emailNotification: Notification;

  @Expose()
  inAppNotification: Notification;

  @Expose()
  _2FAEnabled: boolean;

  @Exclude()
  _2FAVerified: boolean;

  @Expose()
  hasAuthPin: boolean;

  @Exclude()
  hashedPin: string;

  @Exclude()
  _2FAData: any;

  @Exclude()
  backupCodes: string[];

  @Expose()
  referralCode: string;
}

export class FollowResponseDto {
  @ApiProperty()
  message: string;
}

export class FollowersResponseDto {
  @ApiProperty({ type: [String] })
  followers: string[];
}

export class IsFollowingResponseDto {
  @ApiProperty()
  isFollowing: boolean;
}
