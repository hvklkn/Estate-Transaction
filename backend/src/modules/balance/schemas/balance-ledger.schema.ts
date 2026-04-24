import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { Agent } from '@/modules/agents/schemas/agent.schema';
import { BalanceLedgerType } from '@/modules/balance/domain/balance-ledger-type.enum';
import { Transaction } from '@/modules/transactions/schemas/transaction.schema';

export type BalanceLedgerDocument = HydratedDocument<BalanceLedger>;

@Schema({
  timestamps: {
    createdAt: true,
    updatedAt: false
  },
  collection: 'balance_ledger'
})
export class BalanceLedger {
  @Prop({ required: true, type: Types.ObjectId, ref: Agent.name })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Transaction.name, default: null })
  transactionId!: Types.ObjectId | null;

  @Prop({ required: true, type: String, enum: BalanceLedgerType })
  type!: BalanceLedgerType;

  // All money values are stored in cents for deterministic arithmetic.
  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true })
  previousBalance!: number;

  @Prop({ required: true })
  newBalance!: number;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: Agent.name })
  createdBy!: Types.ObjectId;

  createdAt!: Date;
}

export const BalanceLedgerSchema = SchemaFactory.createForClass(BalanceLedger);

BalanceLedgerSchema.index({ userId: 1, createdAt: -1 });
BalanceLedgerSchema.index({ transactionId: 1, type: 1, createdAt: -1 });
BalanceLedgerSchema.index({ createdBy: 1, createdAt: -1 });
