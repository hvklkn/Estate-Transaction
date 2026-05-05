import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsMongoId, IsOptional } from 'class-validator';

import { PropertyListingType } from '@/modules/properties/domain/property-listing-type.enum';
import { PropertyStatus } from '@/modules/properties/domain/property-status.enum';
import { TaskStatus } from '@/modules/tasks/domain/task-status.enum';
import { TransactionStage } from '@/modules/transactions/domain/transaction-stage.enum';
import { TransactionType } from '@/modules/transactions/domain/transaction-type.enum';

export const REPORT_STATUS_VALUES = [
  ...Object.values(PropertyStatus),
  ...Object.values(TaskStatus)
] as const;

export class ReportQueryDto {
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsMongoId()
  @IsOptional()
  agentId?: string;

  @IsIn(Object.values(TransactionType))
  @IsOptional()
  transactionType?: TransactionType;

  @IsIn(Object.values(TransactionStage))
  @IsOptional()
  transactionStage?: TransactionStage;

  @IsIn(Object.values(PropertyListingType))
  @IsOptional()
  propertyListingType?: PropertyListingType;

  @IsIn(REPORT_STATUS_VALUES)
  @IsOptional()
  status?: (typeof REPORT_STATUS_VALUES)[number];
}
