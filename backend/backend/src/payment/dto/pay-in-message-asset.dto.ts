import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PayInMessageMediaAssetDto {
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
    example: '507f1f77bcf86cd799439022',
    description: 'chat conversation Id',
  })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439022',
    description: 'message asset Id',
  })
  @IsString()
  @IsNotEmpty()
  messageId: string;
}
