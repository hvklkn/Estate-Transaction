import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

import { BalanceLedgerType } from '@/modules/balance/domain/balance-ledger-type.enum';

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const nextValue = Number(value);
    return Number.isNaN(nextValue) ? undefined : nextValue;
  }

  return undefined;
};

export class ListBalanceLedgerQueryDto {
  @Transform(({ value }) => toOptionalNumber(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Transform(({ value }) => toOptionalNumber(value))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @IsEnum(BalanceLedgerType)
  @IsOptional()
  type?: BalanceLedgerType;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
