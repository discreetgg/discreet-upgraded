import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class BlockUserDto {
  @ApiProperty({
    description: 'The discord ID of the user to block',
    example: '675a91b9fc13ae456a000001',
  })
  @IsString()
  discordId: string;
}
