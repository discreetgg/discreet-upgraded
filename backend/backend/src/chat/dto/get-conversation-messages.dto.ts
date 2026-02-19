import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const DEFAULT_MESSAGES_LIMIT = 50;

const toIntegerOrDefault = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.floor(value);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const toOptionalTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export class GetConversationMessagesDto {
  @ApiPropertyOptional({
    description: 'Number of messages to fetch in one page',
    default: DEFAULT_MESSAGES_LIMIT,
    minimum: 1,
    maximum: 100,
  })
  @Transform(({ value }) => toIntegerOrDefault(value, DEFAULT_MESSAGES_LIMIT))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = DEFAULT_MESSAGES_LIMIT;

  @ApiPropertyOptional({
    description: 'Pagination cursor returned from a previous messages page',
  })
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Start of a createdAt date range (ISO string)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'End of a createdAt date range (ISO string)',
    example: '2025-02-01T00:00:00.000Z',
  })
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsOptional()
  @IsDateString()
  to?: string;
}
