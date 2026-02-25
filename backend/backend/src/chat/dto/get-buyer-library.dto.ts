import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const DEFAULT_BUYER_LIBRARY_LIMIT = 40;

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

export class GetBuyerLibraryDto {
  @ApiPropertyOptional({
    description: 'Number of purchased items to fetch in one page',
    default: DEFAULT_BUYER_LIBRARY_LIMIT,
    minimum: 1,
    maximum: 60,
  })
  @Transform(({ value }) =>
    toIntegerOrDefault(value, DEFAULT_BUYER_LIBRARY_LIMIT),
  )
  @IsInt()
  @Min(1)
  @Max(60)
  limit = DEFAULT_BUYER_LIBRARY_LIMIT;

  @ApiPropertyOptional({
    description:
      'Pagination cursor returned from a previous purchased media page',
  })
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Optional creator username prefix filter',
    example: 'creator_name',
  })
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsOptional()
  @IsString()
  sellerUsername?: string;
}
