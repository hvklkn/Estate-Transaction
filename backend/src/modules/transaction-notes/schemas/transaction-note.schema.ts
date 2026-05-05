import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { Agent } from '@/modules/agents/schemas/agent.schema';
import { Transaction } from '@/modules/transactions/schemas/transaction.schema';

export type TransactionNoteDocument = HydratedDocument<TransactionNote>;

@Schema({
  timestamps: true,
  collection: 'transaction_notes'
})
export class TransactionNote {
  @Prop({ required: true, type: Types.ObjectId, ref: Transaction.name })
  transactionId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: Agent.name })
  authorId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Organization' })
  organizationId!: Types.ObjectId;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  @Prop({ type: Types.ObjectId, ref: Agent.name, default: null })
  deletedBy!: Types.ObjectId | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const TransactionNoteSchema = SchemaFactory.createForClass(TransactionNote);

TransactionNoteSchema.index({ organizationId: 1, transactionId: 1, createdAt: -1 });
TransactionNoteSchema.index({ organizationId: 1, createdAt: -1 });
TransactionNoteSchema.index({ organizationId: 1, authorId: 1, createdAt: -1 });
TransactionNoteSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
