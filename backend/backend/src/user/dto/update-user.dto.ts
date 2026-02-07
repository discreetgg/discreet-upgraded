import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
// import { Role } from 'src/database/schemas/user.schema';

class InAppNotificationDto {
  @ApiPropertyOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  newFollower?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  newComment?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  newLike?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  newSubscriber?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  tip?: boolean;
}

class DiscordNotificationDto extends InAppNotificationDto {}

class EmailNotificationDto {
  @ApiPropertyOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  newSubscriber?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  tip?: boolean;
}

export class UpdateUserDto {
  // @ApiPropertyOptional({
  //   example: 'discord@mail.com',
  //   description: 'email of the user',
  // })
  // email?: string;

  // @ApiPropertyOptional({
  //   example: 'new_username',
  //   description: 'Username of the user',
  // })
  // username?: string;

  // @ApiPropertyOptional({
  //   example: 'New Display Name',
  //   description: 'Display name of the user',
  // })
  // displayName?: string;

  // @ApiPropertyOptional({
  //   enum: Role,
  //   example: Role.BUYER,
  //   description: 'Role of the user',
  // })
  // @IsOptional()
  // @IsEnum(Role)
  // role?: Role;

  @ApiPropertyOptional({
    example: 'New Display Name',
    description: 'Display name of the user',
  })
  displayName?: string;

  @ApiPropertyOptional({ example: 'This is my bio', description: 'User bio' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Enable Discord notifications' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DiscordNotificationDto)
  discordNotification?: DiscordNotificationDto;

  @ApiPropertyOptional({ description: 'Enable Email notifications' })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmailNotificationDto)
  emailNotification?: EmailNotificationDto;

  @ApiPropertyOptional({ description: 'Enable inapp notifications' })
  @IsOptional()
  @ValidateNested()
  @Type(() => InAppNotificationDto)
  inAppNotification?: InAppNotificationDto;

  // @ApiPropertyOptional({ example: false, description: 'Enable 2FA' })
  // @IsOptional()
  // @IsBoolean()
  // _2FA?: boolean;
}
