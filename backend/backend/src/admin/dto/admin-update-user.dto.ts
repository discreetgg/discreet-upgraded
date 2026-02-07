import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Role } from 'src/database/schemas/user.schema';

export class AdminUpdateUserDto {
  @ApiPropertyOptional({
    description: 'Username of the user',
    example: 'new_username',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: 'Email of the user',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Display name of the user',
    example: 'New Display Name',
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({
    enum: Role,
    description: 'Role of the user',
    example: Role.BUYER,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'User bio',
    example: 'This is my bio',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Is age verified',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isAgeVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Call rate per minute',
    example: 5.0,
  })
  @IsOptional()
  @IsNumber()
  callRate?: number;

  @ApiPropertyOptional({
    description: 'Minimum call time in minutes',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  minimumCallTime?: number;

  @ApiPropertyOptional({
    description: 'Is taking cams',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  takingCams?: boolean;

  @ApiPropertyOptional({
    description: 'Is taking calls',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  takingCalls?: boolean;

  @ApiPropertyOptional({
    description: 'Is guest',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isGuest?: boolean;
}
