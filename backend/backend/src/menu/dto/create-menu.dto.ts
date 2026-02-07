import {
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
  // IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export class MediaMetaDto {
  @ApiProperty({ enum: ['image', 'video'] })
  @IsEnum(['image', 'video'])
  type?: 'image' | 'video';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caption?: string;
}

export class CreateMenuDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ example: '50' })
  @Type(() => String)
  @IsString()
  priceToView: string;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  @Type(() => String)
  @IsString()
  discount?: string;

  @ApiProperty({ example: 'Face Card' })
  @IsString()
  category: string;

  // @ApiProperty({ example: 1 })
  // @Type(() => Number)
  // @IsNumber()
  // itemCount: number;

  @ApiPropertyOptional({
    example: 'Thank you @_Buyer for the purchase ❤❤❤',
  })
  @IsOptional()
  @IsString()
  noteToBuyer?: string;

  @ApiPropertyOptional({
    type: [MediaMetaDto],
    description: 'Array of media metadata',
    example: [
      { type: 'image', caption: 'cover image' },
      { type: 'image', caption: 'content image' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaMetaDto)
  mediaMeta?: MediaMetaDto[];
}
export class UpdateMenuDto extends PartialType(CreateMenuDto) {}
