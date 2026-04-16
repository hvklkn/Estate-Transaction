import { IsEnum } from 'class-validator';

import { TransactionStage } from '@/modules/transactions/domain/transaction-stage.enum';

const ALLOWED_STAGE_VALUES = Object.values(TransactionStage).join(', ');

export class UpdateTransactionStageDto {
  @IsEnum(TransactionStage, {
    message: `stage must be one of: ${ALLOWED_STAGE_VALUES}`
  })
  stage!: TransactionStage;
}
