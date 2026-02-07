import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLikeDto {
  @ApiProperty({
    description: 'DiscordId of the user',
    example: '64d2f5bd7c5a1a44a0ef1234',
  })
  @IsOptional()
  @IsString()
  discordID: string;

  @ApiProperty({
    description: 'ID of the content being liked (Post or Comment)',
    example: '64d2f5bd7c5a1a44a0ef1234',
  })
  @IsString()
  targetId: string;

  @ApiProperty({
    description: 'Type of the content being liked',
    enum: ['Post', 'Comment', 'Server'],
    example: 'Post or Comment or Server',
  })
  @IsEnum(['Post', 'Comment'])
  targetType: 'Post' | 'Comment' | 'Server';
}
