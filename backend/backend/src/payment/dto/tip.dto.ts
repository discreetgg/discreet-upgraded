import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class TipDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Sender Discord ID',
  })
  @IsString()
  @IsNotEmpty()
  tipperId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439022',
    description: 'Receiver Discord ID',
  })
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @ApiProperty({ example: '25.50', description: 'Amount in dollars' })
  @Transform(({ value }) => parseFloat(value)) // 👈 Converts string to number
  @IsNumber()
  @IsNotEmpty()
  amount: number; // 👈 Make this a number now

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  postId?: string;
}
