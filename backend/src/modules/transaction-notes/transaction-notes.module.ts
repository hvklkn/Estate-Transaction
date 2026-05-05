import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RolesGuard } from '@/common/auth/roles.guard';
import { SessionAuthGuard } from '@/common/auth/session-auth.guard';
import { AgentsModule } from '@/modules/agents/agents.module';
import { TransactionNotesController } from '@/modules/transaction-notes/controllers/transaction-notes.controller';
import {
  TransactionNote,
  TransactionNoteSchema
} from '@/modules/transaction-notes/schemas/transaction-note.schema';
import { TransactionNotePolicyService } from '@/modules/transaction-notes/services/transaction-note-policy.service';
import { TransactionNotesService } from '@/modules/transaction-notes/services/transaction-notes.service';
import { TransactionsModule } from '@/modules/transactions/transactions.module';

@Module({
  imports: [
    AgentsModule,
    TransactionsModule,
    MongooseModule.forFeature([
      {
        name: TransactionNote.name,
        schema: TransactionNoteSchema
      }
    ])
  ],
  controllers: [TransactionNotesController],
  providers: [TransactionNotesService, TransactionNotePolicyService, SessionAuthGuard, RolesGuard],
  exports: [TransactionNotesService]
})
export class TransactionNotesModule {}
