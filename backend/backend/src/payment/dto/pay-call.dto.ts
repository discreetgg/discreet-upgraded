import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class PayCallDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'caller ID',
  })
  @IsString()
  @IsNotEmpty()
  callerId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439022',
    description: 'callee Discord ID',
  })
  @IsString()
  @IsNotEmpty()
  calleeId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439022',
    description: 'call Id',
  })
  @IsString()
  @IsNotEmpty()
  callId: string;

  @ApiProperty({ example: '25.50', description: 'Amount in dollars' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({
    example: '60',
    description: 'durations of call in seconds',
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @IsOptional()
  duration?: number;
}
