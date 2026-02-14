import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

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
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? value : parsed;
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  itemCount?: number;
}
