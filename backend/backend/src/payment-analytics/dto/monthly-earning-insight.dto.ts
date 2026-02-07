import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class MonthlyEarningDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439022',
    description: 'seller Discord ID',
  })
  @IsString()
  @IsNotEmpty()
  sellerId: string;

  @ApiProperty({ example: '1', description: 'month is format 1 - 12' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @IsNotEmpty()
  month: number;

  @ApiProperty({ example: '2025', description: 'year' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @IsNotEmpty()
  year: number;
}
