import { Transform } from 'class-transformer';
import {
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
