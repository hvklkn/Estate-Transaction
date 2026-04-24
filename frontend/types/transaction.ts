export enum TransactionStage {
  AGREEMENT = 'agreement',
  EARNEST_MONEY = 'earnest_money',
  TITLE_DEED = 'title_deed',
  COMPLETED = 'completed'
}

export enum TransactionType {
  SOLD = 'sold',
  RENTED = 'rented'
}

export const TRANSACTION_STAGE_ORDER: TransactionStage[] = [
  TransactionStage.AGREEMENT,
  TransactionStage.EARNEST_MONEY,
  TransactionStage.TITLE_DEED,
  TransactionStage.COMPLETED
];

export type CommissionAgentRole = 'listing' | 'selling' | 'listing_and_selling';

export interface AgentSummary {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface AgentCommissionAllocation {
  agentId: string;
  role: CommissionAgentRole;
  amount: number;
  explanation: string;
}

export interface FinancialBreakdown {
  agencyAmount: number;
  agentPoolAmount: number;
  agents: AgentCommissionAllocation[];
}

export interface TransactionStageHistoryItem {
  fromStage: TransactionStage | null;
  toStage: TransactionStage;
  changedAt: string;
  changedBy?: AgentSummary;
  changedById?: string;
}

export interface Transaction {
  id: string;
  propertyTitle: string;
  totalServiceFee: number;
  listingAgentId: string;
  sellingAgentId: string;
  transactionType: TransactionType;
  createdById?: string;
  updatedById?: string | null;
  deletedById?: string | null;
  listingAgent?: AgentSummary;
  sellingAgent?: AgentSummary;
  createdBy?: AgentSummary;
  updatedBy?: AgentSummary;
  deletedBy?: AgentSummary;
  stage: TransactionStage;
  stageHistory: TransactionStageHistoryItem[];
  financialBreakdown: FinancialBreakdown;
  balanceDistributionApplied: boolean;
  balanceDistributionAppliedAt?: string | null;
  balanceDistributionAppliedById?: string | null;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTransactionPayload {
  propertyTitle: string;
  totalServiceFee: number;
  listingAgentId: string;
  sellingAgentId: string;
  transactionType: TransactionType;
  stage?: TransactionStage;
}

export interface UpdateTransactionPayload {
  propertyTitle?: string;
  totalServiceFee?: number;
  listingAgentId?: string;
  sellingAgentId?: string;
  transactionType?: TransactionType;
}

export interface UpdateTransactionStagePayload {
  stage: TransactionStage;
}

export interface TransactionEarningsByAgent {
  agentId: string;
  earnings: number;
}

export interface CompletedTransactionEarningsSummary {
  totalAgencyEarnings: number;
  totalAgentEarnings: number;
  byAgent: TransactionEarningsByAgent[];
}

export type TransactionSortBy = 'createdAt' | 'updatedAt' | 'totalServiceFee' | 'propertyTitle';
export type TransactionSortOrder = 'asc' | 'desc';

export interface TransactionListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  stage?: TransactionStage;
  transactionType?: TransactionType;
  sortBy?: TransactionSortBy;
  sortOrder?: TransactionSortOrder;
  includeDeleted?: boolean;
}

export interface PaginatedTransactionsResponse {
  items: Transaction[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
