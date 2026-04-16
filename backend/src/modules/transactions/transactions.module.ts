import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AgentsModule } from '@/modules/agents/agents.module';
import { CommissionsModule } from '@/modules/commissions/commissions.module';
import { StagePolicyModule } from '@/modules/stage-policy/stage-policy.module';
import { TransactionsController } from '@/modules/transactions/controllers/transactions.controller';
import {
  Transaction,
  TransactionSchema
} from '@/modules/transactions/schemas/transaction.schema';
import { TransactionsService } from '@/modules/transactions/services/transactions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Transaction.name,
        schema: TransactionSchema
      }
    ]),
    AgentsModule,
    CommissionsModule,
    StagePolicyModule
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService]
})
export class TransactionsModule {}
