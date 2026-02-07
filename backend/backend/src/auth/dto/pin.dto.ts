import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePinDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  discordId: string;

  @ApiProperty()
  @IsString()
  @Length(4, 6)
  pin: string;
}

export class ChangePinDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  discordId: string;

  @ApiProperty()
  @IsString()
  @Length(4, 6)
  oldPin: string;

  @ApiProperty()
  @IsString()
  @Length(4, 6)
  newPin: string;
}

export class VerifyPinDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  discordId: string;

  @ApiProperty()
  @IsString()
  @Length(4, 6)
  pin: string;
}
