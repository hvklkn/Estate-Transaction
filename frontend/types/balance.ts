export type BalanceLedgerType = 'commission_credit' | 'manual_adjustment' | 'reversal';

export interface BalanceLedgerEntry {
  id: string;
  userId: string;
  transactionId: string | null;
  type: BalanceLedgerType;
  amount: number;
  amountCents: number;
  previousBalance: number;
  previousBalanceCents: number;
  newBalance: number;
  newBalanceCents: number;
  description: string;
  createdAt: string;
  createdBy: string;
}

export interface BalanceSummary {
  userId: string;
  balance: number;
  balanceCents: number;
  totalEarned: number;
  totalEarnedCents: number;
  recentLedgerEntries: BalanceLedgerEntry[];
}

export interface BalanceLedgerQuery {
  page?: number;
  limit?: number;
  type?: BalanceLedgerType;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedBalanceLedger {
  items: BalanceLedgerEntry[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
