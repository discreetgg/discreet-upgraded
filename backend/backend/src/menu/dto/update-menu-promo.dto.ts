import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PromoType } from 'src/database/schemas/menu.schema';

export class UpdateMenuPromoDto {
  @ApiProperty({
    description: 'Enable or disable promotion for this menu listing',
    example: true,
  })
  @IsBoolean()
  isEnabled: boolean;

  @ApiPropertyOptional({
    enum: PromoType,
    description: 'Promo mode: percentage off or fixed amount off',
    example: PromoType.PERCENTAGE,
  })
  @IsOptional()
  @IsEnum(PromoType)
  type?: PromoType;

  @ApiPropertyOptional({
    description:
      'Promo value. For percentage use values like "15". For fixed use dollar amount like "5".',
    example: '15',
  })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({
    description:
      'Promo start datetime in ISO-8601 format. Leave empty for immediate start.',
    example: '2026-02-20T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  startsAt?: string;

  @ApiPropertyOptional({
    description: 'Promo end datetime in ISO-8601 format',
    example: '2026-02-21T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  endsAt?: string;

  @ApiPropertyOptional({
    description: 'Optional short promo message shown to buyers',
    example: 'Weekend flash sale',
  })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  message?: string;
}
