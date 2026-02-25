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
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  newFollower?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  newComment?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  newLike?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  newSubscriber?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  tip?: boolean;
}

class DiscordNotificationDto extends InAppNotificationDto {}

class EmailNotificationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  newSubscriber?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
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
  @IsOptional()
  @IsString()
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
