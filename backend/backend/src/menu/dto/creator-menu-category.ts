import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Face Pics',
  })
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Creator discord ID',
    example: '64e4a12345abcd6789ef0123',
    required: false,
  })
  @IsString()
  owner: string;
}
