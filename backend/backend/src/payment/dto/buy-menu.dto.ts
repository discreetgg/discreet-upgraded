import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class BuyMenuDto {
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
    description: 'Menu Id',
  })
  @IsString()
  @IsNotEmpty()
  menuId: string;

  @ApiProperty({ example: '2', description: 'Number of Item to buy' })
  @Transform(({ value }) => parseFloat(value)) // 👈 Converts string to number
  @IsNumber()
  @IsOptional()
  itemCount: number;
}
