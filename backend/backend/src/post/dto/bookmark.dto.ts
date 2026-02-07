import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class BookmarkDto {
  @ApiProperty()
  @IsString()
  postId: string;
}
