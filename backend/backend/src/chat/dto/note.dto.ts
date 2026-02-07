import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class NoteDto {
  @ApiProperty({
    description: 'Seller discord ID',
    example: '868282688399393993',
  })
  @IsNotEmpty()
  @IsString()
  seller: string;

  @ApiProperty({
    description: 'Buyer discord ID',
    example: '868282688399393993',
  })
  @IsNotEmpty()
  @IsString()
  buyer: string;

  @ApiProperty({ description: 'Internal note text', example: 'Good customer' })
  @IsNotEmpty()
  @IsString()
  note: string;
}
