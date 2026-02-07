// dto/subscribe-user.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SubscribeUserDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Buyer Discord ID',
  })
  @IsString()
  @IsNotEmpty()
  buyerId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439022',
    description: 'Seller Discord ID',
  })
  @IsString()
  @IsNotEmpty()
  sellerId: string;

  @ApiProperty({
    description: 'ID of the subscription plan',
    example: '64f7c4fa8d8f57a4b3d77d2f',
  })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({
    example: '1',
    description: 'Subscription duration count in months (optional)',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? parseFloat(value) : undefined,
  )
  @IsNumber()
  durationInMonths?: number;
}
