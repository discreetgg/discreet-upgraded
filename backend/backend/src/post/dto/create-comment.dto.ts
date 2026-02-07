import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'DiscordId of the user',
    example: '64d2f5bd7c5a1a44a0ef1234',
  })
  @IsString()
  @IsNotEmpty()
  authorId: string;

  @ApiProperty({
    description: 'ID of the post being commented on',
    example: '64e7cabf8d9f0e001f32a4aa',
  })
  @IsString()
  @IsNotEmpty()
  postId: string;

  @ApiProperty({
    description: 'Content of the comment',
    example: 'This is a comment on the post!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Optional parent comment ID (for replies)',
    example: '64e7cac18d9f0e001f32a4ab',
  })
  @IsOptional()
  @IsString()
  parentCommentId?: string;
}
