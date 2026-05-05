import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SessionAuthGuard } from '@/common/auth/session-auth.guard';
import { AgentsModule } from '@/modules/agents/agents.module';
import { BalanceModule } from '@/modules/balance/balance.module';
import { ClientsModule } from '@/modules/clients/clients.module';
import { CommissionsModule } from '@/modules/commissions/commissions.module';
import { PropertiesModule } from '@/modules/properties/properties.module';
import { StagePolicyModule } from '@/modules/stage-policy/stage-policy.module';
import { TransactionsController } from '@/modules/transactions/controllers/transactions.controller';
import { Transaction, TransactionSchema } from '@/modules/transactions/schemas/transaction.schema';
import { TransactionMutationPolicyService } from '@/modules/transactions/services/transaction-mutation-policy.service';
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
    ClientsModule,
    PropertiesModule,
    BalanceModule,
    CommissionsModule,
    StagePolicyModule
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionMutationPolicyService, SessionAuthGuard],
  exports: [TransactionsService]
})
export class TransactionsModule {}
