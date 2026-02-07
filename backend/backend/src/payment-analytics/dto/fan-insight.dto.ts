import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FanInsightDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'buyer Discord ID',
  })
  @IsString()
  @IsNotEmpty()
  buyerId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439022',
    description: 'seller Discord ID',
  })
  @IsString()
  @IsNotEmpty()
  sellerId: string;
}
