import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  ReportReason,
  ReportTargetType,
} from 'src/database/schemas/report.schema';

export class CreateReportDto {
  @ApiProperty({
    description: 'DiscordId of the reporter',
    example: '64d2f5bd7c5a1a44a0ef1234',
  })
  @IsString()
  @IsNotEmpty()
  reporterDiscordID: string;

  @ApiProperty({
    description: 'Entity type that is being reported',
    enum: ReportTargetType,
    example: ReportTargetType.USER,
  })
  @IsEnum(ReportTargetType)
  @IsNotEmpty()
  targetType: ReportTargetType;

  @ApiProperty({
    description: 'ID of the what to report, user or post',
    example: '64d2f5bd7c5a1a44a0ef1234',
  })
  @IsString()
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({
    description: 'Reason for reporting (must select predefined reason)',
    enum: ReportReason,
    example: ReportReason.ABUSE_HARASSMENT,
  })
  @IsEnum(ReportReason)
  @IsOptional()
  reason: ReportReason;

  @ApiProperty({
    description: 'additional description for the report',
    example: 'User used abusive language in the comments.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
