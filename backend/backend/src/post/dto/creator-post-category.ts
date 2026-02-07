import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreatePostCategoryDto {
  @ApiProperty({
    description: 'Indicates if the category is general',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  general?: boolean;

  @ApiProperty({
    description: 'List of categories',
    type: [String],
    example: ['Tech', 'Art', 'Lifestyle'],
  })
  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @ApiProperty({
    description: 'Creator discord ID (required if not general)',
    example: '64e4a12345abcd6789ef0123',
    required: false,
  })
  @IsOptional()
  @IsString()
  creator?: string;
}
