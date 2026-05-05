import type { AgentSummary } from '~/types/transaction';
import type { RelatedTransactionSummary } from '~/types/task';

export interface TransactionNote {
  id: string;
  transactionId: string;
  authorId: string;
  content: string;
  transaction?: RelatedTransactionSummary;
  author?: AgentSummary;
  deletedBy?: AgentSummary;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTransactionNotePayload {
  transactionId: string;
  content: string;
}

export interface UpdateTransactionNotePayload {
  content: string;
}
