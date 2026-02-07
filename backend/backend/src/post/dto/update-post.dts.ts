import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateMediaMetaDto {
  @ApiPropertyOptional({ enum: ['image', 'video'] })
  @IsEnum(['image', 'video'])
  type?: 'image' | 'video';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ description: 'The id of media to update' })
  @IsOptional()
  @IsString()
  updateMediaId?: string;
}
export class UpdatePostDto extends PartialType(CreatePostDto) {}
