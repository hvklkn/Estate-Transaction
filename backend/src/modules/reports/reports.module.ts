import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RolesGuard } from '@/common/auth/roles.guard';
import { SessionAuthGuard } from '@/common/auth/session-auth.guard';
import { AgentsModule } from '@/modules/agents/agents.module';
import { Agent, AgentSchema } from '@/modules/agents/schemas/agent.schema';
import { BalanceLedger, BalanceLedgerSchema } from '@/modules/balance/schemas/balance-ledger.schema';
import { Client, ClientSchema } from '@/modules/clients/schemas/client.schema';
import { Property, PropertySchema } from '@/modules/properties/schemas/property.schema';
import { ReportsController } from '@/modules/reports/controllers/reports.controller';
import { ReportsService } from '@/modules/reports/services/reports.service';
import { Task, TaskSchema } from '@/modules/tasks/schemas/task.schema';
import {
  TransactionNote,
  TransactionNoteSchema
} from '@/modules/transaction-notes/schemas/transaction-note.schema';
import { Transaction, TransactionSchema } from '@/modules/transactions/schemas/transaction.schema';

@Module({
  imports: [
    AgentsModule,
    MongooseModule.forFeature([
      { name: Agent.name, schema: AgentSchema },
      { name: BalanceLedger.name, schema: BalanceLedgerSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Task.name, schema: TaskSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: TransactionNote.name, schema: TransactionNoteSchema }
    ])
  ],
  controllers: [ReportsController],
  providers: [ReportsService, SessionAuthGuard, RolesGuard],
  exports: [ReportsService]
})
export class ReportsModule {}
