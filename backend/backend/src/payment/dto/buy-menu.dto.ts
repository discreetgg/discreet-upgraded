import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PurchaseOriginSurface } from 'src/database/schemas/message.schema';

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

  @ApiProperty({
    example: PurchaseOriginSurface.FEED,
    enum: PurchaseOriginSurface,
    required: false,
    default: PurchaseOriginSurface.UNKNOWN,
    description: 'Surface where unlock was initiated',
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return PurchaseOriginSurface.UNKNOWN;
    }

    const normalized = value.trim().toLowerCase();
    if (
      normalized === PurchaseOriginSurface.FEED ||
      normalized === PurchaseOriginSurface.PROFILE ||
      normalized === PurchaseOriginSurface.MENU ||
      normalized === PurchaseOriginSurface.DM
    ) {
      return normalized;
    }
    return PurchaseOriginSurface.UNKNOWN;
  })
  @IsOptional()
  @IsEnum(PurchaseOriginSurface)
  originSurface?: PurchaseOriginSurface;
}
