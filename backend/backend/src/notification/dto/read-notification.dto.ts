import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReadDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Buyer Discord ID',
  })
  @IsString()
  @IsNotEmpty()
  discordId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'notification Id',
  })
  @IsString()
  @IsNotEmpty()
  notificationId: string;
}
