import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ManualBalanceAdjustmentDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsMongoId()
  userId!: string;

  @IsNumber()
  amount!: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  description!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsMongoId()
  @IsOptional()
  transactionId?: string;
}
