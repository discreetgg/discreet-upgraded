import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, IsString } from 'class-validator';

export class GetConversationDto {
  @ApiProperty({
    description: 'Two discord user IDs to check conversation between',
    minItems: 2,
    maxItems: 2,
  })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  discordIds: string[];
}
