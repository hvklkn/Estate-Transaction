import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator';

import { TransactionStage } from '@/modules/transactions/domain/transaction-stage.enum';
import { TransactionType } from '@/modules/transactions/domain/transaction-type.enum';

export const TRANSACTION_SORT_BY_FIELDS = [
  'createdAt',
  'updatedAt',
  'totalServiceFee',
  'propertyTitle'
] as const;
export type TransactionSortByField = (typeof TRANSACTION_SORT_BY_FIELDS)[number];

export const TRANSACTION_SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type TransactionSortDirection = (typeof TRANSACTION_SORT_DIRECTIONS)[number];

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = Number(value);
    return Number.isNaN(normalizedValue) ? undefined : normalizedValue;
  }

  return undefined;
};

const toOptionalBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === 'true') {
      return true;
    }

    if (normalizedValue === 'false') {
      return false;
    }
  }

  return undefined;
};

export class ListTransactionsQueryDto {
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

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(TransactionStage)
  @IsOptional()
  stage?: TransactionStage;

  @IsEnum(TransactionType)
  @IsOptional()
  transactionType?: TransactionType;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsIn(TRANSACTION_SORT_BY_FIELDS)
  @IsOptional()
  sortBy?: TransactionSortByField;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value
  )
  @IsIn(TRANSACTION_SORT_DIRECTIONS)
  @IsOptional()
  sortOrder?: TransactionSortDirection;

  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  @IsOptional()
  includeDeleted?: boolean;
}
