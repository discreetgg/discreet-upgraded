import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyAgeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  discordId: string;
}
