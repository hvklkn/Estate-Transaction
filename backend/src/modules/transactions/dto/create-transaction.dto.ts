import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  Min
} from 'class-validator';

import { TransactionStage } from '@/modules/transactions/domain/transaction-stage.enum';
import { TransactionType } from '@/modules/transactions/domain/transaction-type.enum';

export class CreateTransactionDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  propertyTitle!: string;

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
  totalServiceFee!: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsMongoId()
  listingAgentId!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsMongoId()
  sellingAgentId!: string;

  @IsEnum(TransactionType)
  transactionType!: TransactionType;

  @IsEnum(TransactionStage)
  @IsOptional()
  stage?: TransactionStage;
}
