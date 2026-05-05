import type { PropertyListingType, PropertyStatus } from '~/types/property';
import type { TaskStatus } from '~/types/task';
import type { TransactionStage, TransactionType } from '~/types/transaction';

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  agentId?: string;
  transactionType?: TransactionType;
  transactionStage?: TransactionStage;
  propertyListingType?: PropertyListingType;
  status?: PropertyStatus | TaskStatus;
}

export interface ReportCountItem {
  key: string;
  count: number;
}

export interface ReportTrendItem {
  period: string;
  count?: number;
  totalServiceFee?: number;
}

export interface AgentPerformanceReportItem {
  agentId: string;
  agentName: string;
  closedDeals: number;
  totalCommissionEarnings: number;
  totalCommissionEarningsCents: number;
}

export interface ReportActivityItem {
  type: 'transaction' | 'task' | 'note' | 'balance';
  title: string;
  occurredAt: string;
  actorId: string | null;
}

export interface ReportsSummary {
  filters: {
    dateFrom: string | null;
    dateTo: string | null;
    agentId: string | null;
    transactionType: TransactionType | null;
    transactionStage: TransactionStage | null;
    propertyListingType: PropertyListingType | null;
    status: string | null;
  };
  transactionCountsByStage: ReportCountItem[];
  transactionCountsByType: ReportCountItem[];
  completedDealsOverTime: ReportTrendItem[];
  totalServiceFeeOverTime: ReportTrendItem[];
  monthlyServiceFee: number;
  monthlyServiceFeeCents: number;
  agentPerformance: AgentPerformanceReportItem[];
  taskSummary: {
    pending: number;
    completed: number;
    overdue: number;
  };
  recentActivity: ReportActivityItem[];
  commissionSummary: {
    agencyTotal: number;
    agencyTotalCents: number;
    agentPoolTotal: number;
    agentPoolTotalCents: number;
    agentEarningsTotal: number;
    agentEarningsTotalCents: number;
  };
}

export type ReportExportKind = 'transactions' | 'clients' | 'properties' | 'tasks' | 'commissions';
