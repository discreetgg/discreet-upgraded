import { ApiProperty } from '@nestjs/swagger';

import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatGuestUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isSeller?: boolean;
}
