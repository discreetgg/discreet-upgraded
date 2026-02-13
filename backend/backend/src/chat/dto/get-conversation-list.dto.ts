import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const DEFAULT_CONVERSATION_LIMIT = 30;

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

export class GetConversationListDto {
  @ApiPropertyOptional({
    description: 'Number of conversations to fetch in one page',
    default: DEFAULT_CONVERSATION_LIMIT,
    minimum: 1,
    maximum: 100,
  })
  @Transform(({ value }) =>
    toIntegerOrDefault(value, DEFAULT_CONVERSATION_LIMIT),
  )
  @IsInt()
  @Min(1)
  @Max(100)
  limit = DEFAULT_CONVERSATION_LIMIT;

  @ApiPropertyOptional({
    description:
      'Pagination cursor returned from a previous conversations page',
  })
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description:
      'Case-insensitive participant search (display name or username)',
  })
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsOptional()
  @IsString()
  search?: string;
}
