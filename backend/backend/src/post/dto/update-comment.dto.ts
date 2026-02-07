import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({
    description: 'DiscordId of the user',
    example: '64d2f5bd7c5a1a44a0ef1234',
  })
  @IsString()
  @IsNotEmpty()
  authorId: string;

  @ApiProperty({
    description: 'Updated content of the comment',
    example: 'Edited my previous comment to clarify things.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
