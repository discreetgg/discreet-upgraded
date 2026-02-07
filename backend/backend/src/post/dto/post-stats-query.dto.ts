import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumberString } from 'class-validator';

export class PostStatsQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Month (1-12)' })
  @IsOptional()
  @IsNumberString()
  month?: string;

  @ApiPropertyOptional({ example: 2025, description: 'Year (e.g. 2025)' })
  @IsOptional()
  @IsNumberString()
  year?: string;
}
