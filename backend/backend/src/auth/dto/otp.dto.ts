import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateOtpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  discordId: string;
}

export class VerifyOtpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  discordId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ValidateOtpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  discordId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class DisableOtpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  discordId: string;
}
