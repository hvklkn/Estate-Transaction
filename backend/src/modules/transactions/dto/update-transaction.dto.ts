import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min
} from 'class-validator';

import { TransactionType } from '@/modules/transactions/domain/transaction-type.enum';

export class UpdateTransactionDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  propertyTitle?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsMongoId()
  @IsOptional()
  propertyId?: string | null;

  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((item) => (typeof item === 'string' ? item.trim() : item))
      : value
  )
  @IsArray()
  @ArrayUnique()
  @IsMongoId({ each: true })
  @IsOptional()
  clientIds?: string[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalServiceFee?: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsMongoId()
  @IsOptional()
  listingAgentId?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsMongoId()
  @IsOptional()
  sellingAgentId?: string;

  @IsEnum(TransactionType)
  @IsOptional()
  transactionType?: TransactionType;
}
