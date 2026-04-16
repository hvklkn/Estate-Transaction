export enum CommissionAgentRole {
  LISTING = 'listing',
  SELLING = 'selling',
  LISTING_AND_SELLING = 'listing_and_selling'
}

export interface CommissionCalculationInput {
  totalServiceFee: number;
  listingAgentId: string;
  sellingAgentId: string;
}

export interface AgentCommissionBreakdown {
  agentId: string;
  role: CommissionAgentRole;
  amount: number;
  explanation: string;
}

export interface CommissionCalculationResult {
  agencyAmount: number;
  agentPoolAmount: number;
  agents: AgentCommissionBreakdown[];
}
