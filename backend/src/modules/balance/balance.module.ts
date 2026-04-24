import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SessionAuthGuard } from '@/common/auth/session-auth.guard';
import { AgentsModule } from '@/modules/agents/agents.module';
import { Agent, AgentSchema } from '@/modules/agents/schemas/agent.schema';
import { BalanceController } from '@/modules/balance/controllers/balance.controller';
import {
  BalanceLedger,
  BalanceLedgerSchema
} from '@/modules/balance/schemas/balance-ledger.schema';
import { BalanceService } from '@/modules/balance/services/balance.service';
import { Transaction, TransactionSchema } from '@/modules/transactions/schemas/transaction.schema';

@Module({
  imports: [
    AgentsModule,
    MongooseModule.forFeature([
      {
        name: Agent.name,
        schema: AgentSchema
      },
      {
        name: BalanceLedger.name,
        schema: BalanceLedgerSchema
      },
      {
        name: Transaction.name,
        schema: TransactionSchema
      }
    ])
  ],
  controllers: [BalanceController],
  providers: [BalanceService, SessionAuthGuard],
  exports: [BalanceService]
})
export class BalanceModule {}
