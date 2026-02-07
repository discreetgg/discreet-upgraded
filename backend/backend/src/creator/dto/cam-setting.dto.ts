import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CamSettingDto {
  @ApiProperty({
    description: 'discord Id of seller',
    example: '123456789020303',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  sellerId: string;

  @ApiProperty({ example: '2.5', description: 'rate per min in dollars' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @IsNotEmpty()
  rate: number;

  @ApiPropertyOptional({
    example: '1',
    description: 'minimum call time a seller takes',
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  minimumCallTime: number;

  @ApiPropertyOptional({
    example: true,
    description: 'is seller taking cams',
  })
  @IsBoolean()
  takingCams: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'is seller taking calls',
  })
  @IsBoolean()
  takingCalls: boolean;
}
