export enum TransactionStage {
  AGREEMENT = 'agreement',
  EARNEST_MONEY = 'earnest_money',
  TITLE_DEED = 'title_deed',
  COMPLETED = 'completed'
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
  listingAgent?: AgentSummary;
  sellingAgent?: AgentSummary;
  stage: TransactionStage;
  stageHistory: TransactionStageHistoryItem[];
  financialBreakdown: FinancialBreakdown;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTransactionPayload {
  propertyTitle: string;
  totalServiceFee: number;
  listingAgentId: string;
  sellingAgentId: string;
  stage?: TransactionStage;
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
