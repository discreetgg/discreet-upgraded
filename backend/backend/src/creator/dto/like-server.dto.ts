import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LikeServerDto {
  @ApiProperty({
    description: 'DiscordId of the user',
    example: '64d2f5bd7c5a1a44a0ef1234',
  })
  @IsOptional()
  @IsString()
  userDiscordID: string;

  @ApiProperty({
    description: 'ID of the content being liked (Post or Comment)',
    example: '64d2f5bd7c5a1a44a0ef1234',
  })
  @IsString()
  serverId: string;
}
