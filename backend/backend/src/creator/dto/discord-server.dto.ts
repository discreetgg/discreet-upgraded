import {
  IsString,
  IsNotEmpty,
  IsArray,
  Length,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class SubmitDiscordServerDto {
  @ApiProperty({
    description: 'Server Id',
    example: '256176171234567890',
  })
  @IsString()
  @IsNotEmpty()
  @Length(17, 19, { message: 'Guild ID must be a valid Discord snowflake' })
  guildId: string;

  @ApiProperty({
    description: 'Server custom Name (optional display override)',
    example: 'Discreet Network',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  customName?: string;

  @ApiProperty({
    description: 'Discord Invite Link to the Server',
    example: 'https://discord.gg/cdp',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^https?:\/\/(discord\.gg|discord\.com\/invite)\/[A-Za-z0-9-_]+$/, {
    message: 'Invite link must be a valid Discord invite URL (discord.gg/xxxx)',
  })
  inviteLink: string;

  @ApiProperty({
    description: 'Short description of the server',
    example: 'A community for deep tech builders...',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 300, { message: 'Bio cannot exceed 300 characters' })
  bio?: string;

  @ApiProperty({
    type: [String],
    description: 'Tags to categorize server',
    example: ['art', 'tech'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateDiscordServerDtoDto extends PartialType(
  SubmitDiscordServerDto,
) {}
