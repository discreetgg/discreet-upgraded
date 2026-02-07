import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Role } from 'src/database/schemas/user.schema';

export class GenerateJWTDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  discordId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  _id: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsNotEmpty()
  id: string;
}
