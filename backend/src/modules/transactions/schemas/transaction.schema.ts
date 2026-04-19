import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { Agent } from '@/modules/agents/schemas/agent.schema';
import { CommissionAgentRole } from '@/modules/commissions/domain/commission.types';
import { TransactionStage } from '@/modules/transactions/domain/transaction-stage.enum';
import { TransactionType } from '@/modules/transactions/domain/transaction-type.enum';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({
  _id: false
})
export class AgentCommissionAllocation {
  @Prop({ required: true, type: Types.ObjectId, ref: Agent.name })
  agentId!: Types.ObjectId;

  @Prop({ required: true, enum: CommissionAgentRole })
  role!: CommissionAgentRole;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({ required: true, trim: true })
  explanation!: string;
}

export const AgentCommissionAllocationSchema = SchemaFactory.createForClass(
  AgentCommissionAllocation
);

@Schema({
  _id: false
})
export class FinancialBreakdown {
  @Prop({ required: true, min: 0, default: 0 })
  agencyAmount!: number;

  @Prop({ required: true, min: 0, default: 0 })
  agentPoolAmount!: number;

  @Prop({
    required: true,
    type: [AgentCommissionAllocationSchema],
    default: []
  })
  agents!: AgentCommissionAllocation[];
}

export const FinancialBreakdownSchema = SchemaFactory.createForClass(FinancialBreakdown);

@Schema({
  _id: false
})
export class TransactionStageHistoryEntry {
  @Prop({ type: String, enum: TransactionStage, default: null })
  fromStage!: TransactionStage | null;

  @Prop({ required: true, type: String, enum: TransactionStage })
  toStage!: TransactionStage;

  @Prop({ required: true })
  changedAt!: Date;

  @Prop({ type: Types.ObjectId, ref: Agent.name })
  changedBy?: Types.ObjectId;
}

export const TransactionStageHistoryEntrySchema = SchemaFactory.createForClass(
  TransactionStageHistoryEntry
);

@Schema({
  timestamps: true,
  collection: 'transactions'
})
export class Transaction {
  @Prop({ required: true, trim: true })
  propertyTitle!: string;

  @Prop({ required: true, min: 0 })
  totalServiceFee!: number;

  @Prop({ required: true, type: Types.ObjectId, ref: Agent.name })
  listingAgentId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: Agent.name })
  sellingAgentId!: Types.ObjectId;

  @Prop({ required: true, enum: TransactionType, default: TransactionType.SOLD })
  transactionType!: TransactionType;

  @Prop({ type: Types.ObjectId, ref: Agent.name, default: null })
  createdBy!: Types.ObjectId | null;

  @Prop({
    required: true,
    enum: TransactionStage,
    default: TransactionStage.AGREEMENT
  })
  stage!: TransactionStage;

  @Prop({
    type: FinancialBreakdownSchema,
    required: true,
    default: () => ({
      agencyAmount: 0,
      agentPoolAmount: 0,
      agents: []
    })
  })
  financialBreakdown!: FinancialBreakdown;

  @Prop({
    type: [TransactionStageHistoryEntrySchema],
    required: true,
    default: []
  })
  stageHistory!: TransactionStageHistoryEntry[];
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index({ stage: 1, createdAt: -1 });
TransactionSchema.index({ listingAgentId: 1, sellingAgentId: 1 });
TransactionSchema.index({ transactionType: 1, createdAt: -1 });
