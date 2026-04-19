import type {
  AgentCommissionAllocation,
  AgentSummary,
  CompletedTransactionEarningsSummary,
  CreateTransactionPayload,
  FinancialBreakdown,
  Transaction,
  TransactionStageHistoryItem,
  TransactionStage,
  TransactionType
} from '~/types/transaction';
import { TransactionStage as TransactionStageEnum, TransactionType as TransactionTypeEnum } from '~/types/transaction';

const TRANSACTIONS_ENDPOINT = '/transactions';
const TRANSACTION_STAGE_ENDPOINT = (id: string) => `${TRANSACTIONS_ENDPOINT}/${id}/stage`;
const TRANSACTIONS_SUMMARY_ENDPOINT = `${TRANSACTIONS_ENDPOINT}/summary`;
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

type ObjectIdLike = string | { toString(): string };

interface ApiAgent {
  _id?: ObjectIdLike;
  id?: ObjectIdLike;
  name?: string;
  email?: string;
  isActive?: boolean;
}

interface ApiAgentCommissionAllocation {
  agentId?: ObjectIdLike;
  role?: AgentCommissionAllocation['role'];
  amount?: number;
  explanation?: string;
}

interface ApiFinancialBreakdown {
  agencyAmount?: number;
  agentPoolAmount?: number;
  agents?: ApiAgentCommissionAllocation[];
}

interface ApiTransaction {
  _id?: ObjectIdLike;
  id?: ObjectIdLike;
  propertyTitle?: string;
  totalServiceFee?: number;
  listingAgentId?: string | ApiAgent;
  sellingAgentId?: string | ApiAgent;
  transactionType?: TransactionType;
  createdBy?: string | ApiAgent | null;
  stage?: TransactionStage;
  stageHistory?: ApiTransactionStageHistoryItem[];
  financialBreakdown?: ApiFinancialBreakdown;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiTransactionStageHistoryItem {
  fromStage?: TransactionStage | null;
  toStage?: TransactionStage;
  changedAt?: string;
  changedBy?: string | ApiAgent;
}

interface ApiCompletedTransactionEarningsSummary {
  totalAgencyEarnings?: number;
  totalAgentEarnings?: number;
  byAgent?: Array<{ agentId?: ObjectIdLike; earnings?: number }>;
}

const TRANSACTION_STAGE_SET = new Set(Object.values(TransactionStageEnum));
const TRANSACTION_TYPE_SET = new Set(Object.values(TransactionTypeEnum));
const COMMISSION_ROLE_SET = new Set<AgentCommissionAllocation['role']>([
  'listing',
  'selling',
  'listing_and_selling'
]);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};

const toRequiredString = (value: unknown, fieldName: string): string => {
  const normalizedValue = toNonEmptyString(value);

  if (!normalizedValue) {
    throw new Error(`Invalid API response: missing or invalid "${fieldName}".`);
  }

  return normalizedValue;
};

const toRequiredNumber = (value: unknown, fieldName: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid API response: missing or invalid "${fieldName}".`);
  }

  return value;
};

const toRequiredNonNegativeNumber = (value: unknown, fieldName: string): number => {
  const normalizedValue = toRequiredNumber(value, fieldName);

  if (normalizedValue < 0) {
    throw new Error(`Invalid API response: "${fieldName}" cannot be negative.`);
  }

  return normalizedValue;
};

const toOptionalNonNegativeNumber = (value: unknown, fieldName: string): number | null => {
  if (value === undefined || value === null) {
    return null;
  }

  return toRequiredNonNegativeNumber(value, fieldName);
};

const toOptionalObjectIdString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return toNonEmptyString(value);
  }

  if (isObject(value) && typeof value.toString === 'function') {
    return toNonEmptyString(value.toString());
  }

  return null;
};

const toRequiredObjectIdString = (value: unknown, fieldName: string): string => {
  const normalizedValue = toOptionalObjectIdString(value);

  if (!normalizedValue || !OBJECT_ID_REGEX.test(normalizedValue)) {
    throw new Error(`Invalid API response: missing or invalid "${fieldName}".`);
  }

  return normalizedValue;
};

const normalizeAgentSummary = (
  agentReference: string | ApiAgent | undefined,
  fallbackId: string
): AgentSummary | undefined => {
  if (!agentReference || typeof agentReference === 'string') {
    return undefined;
  }

  const name = toNonEmptyString(agentReference.name);
  const email = toNonEmptyString(agentReference.email);

  if (!name || !email) {
    return undefined;
  }

  const id = toOptionalObjectIdString(agentReference.id ?? agentReference._id) ?? fallbackId;

  if (!id) {
    return undefined;
  }

  return {
    id,
    name,
    email,
    isActive: Boolean(agentReference.isActive)
  };
};

const normalizeFinancialBreakdown = (
  financialBreakdown: ApiFinancialBreakdown | undefined,
  defaultListingAgentId: string,
  defaultSellingAgentId: string
): FinancialBreakdown => {
  const agencyAmount =
    toOptionalNonNegativeNumber(financialBreakdown?.agencyAmount, 'financialBreakdown.agencyAmount') ??
    0;
  const agentPoolAmount =
    toOptionalNonNegativeNumber(
      financialBreakdown?.agentPoolAmount,
      'financialBreakdown.agentPoolAmount'
    ) ?? 0;

  const agents = (financialBreakdown?.agents ?? []).map((agent, index) => {
    const normalizedRole = agent.role;

    if (!normalizedRole || !COMMISSION_ROLE_SET.has(normalizedRole)) {
      throw new Error(
        `Invalid API response: unknown financial breakdown role at agents[${index}].`
      );
    }

    const fallbackId = normalizedRole === 'selling' ? defaultSellingAgentId : defaultListingAgentId;

    return {
      agentId: toRequiredObjectIdString(agent.agentId ?? fallbackId, `financialBreakdown.agents[${index}].agentId`),
      role: normalizedRole,
      amount: toRequiredNonNegativeNumber(
        agent.amount,
        `financialBreakdown.agents[${index}].amount`
      ),
      explanation: toRequiredString(
        agent.explanation,
        `financialBreakdown.agents[${index}].explanation`
      )
    };
  });

  return {
    agencyAmount,
    agentPoolAmount,
    agents
  };
};

const normalizeStage = (stage: unknown): TransactionStage => {
  if (typeof stage !== 'string' || !TRANSACTION_STAGE_SET.has(stage as TransactionStage)) {
    throw new Error('Invalid API response: unknown transaction stage value.');
  }

  return stage as TransactionStage;
};

const normalizeOptionalStage = (stage: unknown): TransactionStage | null => {
  if (stage === null || stage === undefined) {
    return null;
  }

  return normalizeStage(stage);
};

const normalizeTransactionType = (transactionType: unknown): TransactionType => {
  if (
    typeof transactionType === 'string' &&
    TRANSACTION_TYPE_SET.has(transactionType as TransactionType)
  ) {
    return transactionType as TransactionType;
  }

  return TransactionTypeEnum.SOLD;
};

const normalizeChangedBy = (
  changedBy: ApiTransactionStageHistoryItem['changedBy']
): Pick<TransactionStageHistoryItem, 'changedBy' | 'changedById'> => {
  if (!changedBy) {
    return {};
  }

  if (typeof changedBy === 'string') {
    return {
      changedById: toRequiredObjectIdString(changedBy, 'stageHistory.changedBy')
    };
  }

  const objectIdValue = toOptionalObjectIdString(changedBy as unknown);
  if (objectIdValue && OBJECT_ID_REGEX.test(objectIdValue)) {
    return {
      changedById: objectIdValue
    };
  }

  const changedById = toRequiredObjectIdString(changedBy.id ?? changedBy._id, 'stageHistory.changedBy');

  return {
    changedById,
    changedBy: normalizeAgentSummary(changedBy, changedById)
  };
};

const normalizeStageHistory = (
  stageHistory: ApiTransactionStageHistoryItem[] | undefined
): TransactionStageHistoryItem[] => {
  return (stageHistory ?? [])
    .map((historyItem, index) => {
      const changedAt = toRequiredString(historyItem.changedAt, `stageHistory[${index}].changedAt`);
      const changedAtDate = new Date(changedAt);

      if (Number.isNaN(changedAtDate.getTime())) {
        throw new Error(`Invalid API response: invalid "stageHistory[${index}].changedAt".`);
      }

      return {
        fromStage: normalizeOptionalStage(historyItem.fromStage),
        toStage: normalizeStage(historyItem.toStage),
        changedAt: changedAtDate.toISOString(),
        ...normalizeChangedBy(historyItem.changedBy)
      };
    })
    .sort((left, right) => new Date(left.changedAt).getTime() - new Date(right.changedAt).getTime());
};

const readSessionTokenFromStorage = (): string | null => {
  if (!import.meta.client) {
    return null;
  }

  const token = window.localStorage.getItem('iceberg.session-token');
  if (typeof token !== 'string') {
    return null;
  }

  const normalizedToken = token.trim();
  return normalizedToken.length > 0 ? normalizedToken : null;
};

const createAuthHeaders = (): HeadersInit => {
  const sessionToken = readSessionTokenFromStorage();

  if (!sessionToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${sessionToken}`
  };
};

export const normalizeTransaction = (apiTransaction: ApiTransaction): Transaction => {
  const transactionId = toRequiredObjectIdString(
    apiTransaction.id ?? apiTransaction._id,
    'transaction.id'
  );

  if (!apiTransaction.listingAgentId) {
    throw new Error('Invalid API response: missing "listingAgentId".');
  }

  if (!apiTransaction.sellingAgentId) {
    throw new Error('Invalid API response: missing "sellingAgentId".');
  }

  const listingAgentId =
    typeof apiTransaction.listingAgentId === 'string'
      ? toRequiredObjectIdString(apiTransaction.listingAgentId, 'listingAgentId')
      : toRequiredObjectIdString(
          apiTransaction.listingAgentId.id ?? apiTransaction.listingAgentId._id,
          'listingAgentId'
        );

  const sellingAgentId =
    typeof apiTransaction.sellingAgentId === 'string'
      ? toRequiredObjectIdString(apiTransaction.sellingAgentId, 'sellingAgentId')
      : toRequiredObjectIdString(
          apiTransaction.sellingAgentId.id ?? apiTransaction.sellingAgentId._id,
          'sellingAgentId'
        );

  let createdById: string | undefined;
  let createdBy: AgentSummary | undefined;

  if (apiTransaction.createdBy) {
    if (typeof apiTransaction.createdBy === 'string') {
      createdById = toRequiredObjectIdString(apiTransaction.createdBy, 'createdBy');
    } else {
      createdById = toRequiredObjectIdString(
        apiTransaction.createdBy.id ?? apiTransaction.createdBy._id,
        'createdBy'
      );
      createdBy = normalizeAgentSummary(apiTransaction.createdBy, createdById);
    }
  }

  return {
    id: transactionId,
    propertyTitle: toRequiredString(apiTransaction.propertyTitle, 'propertyTitle'),
    totalServiceFee: toRequiredNonNegativeNumber(apiTransaction.totalServiceFee, 'totalServiceFee'),
    listingAgentId,
    sellingAgentId,
    transactionType: normalizeTransactionType(apiTransaction.transactionType),
    createdById,
    listingAgent: normalizeAgentSummary(apiTransaction.listingAgentId, listingAgentId),
    sellingAgent: normalizeAgentSummary(apiTransaction.sellingAgentId, sellingAgentId),
    createdBy,
    stage: normalizeStage(apiTransaction.stage),
    stageHistory: normalizeStageHistory(apiTransaction.stageHistory),
    financialBreakdown: normalizeFinancialBreakdown(
      apiTransaction.financialBreakdown,
      listingAgentId,
      sellingAgentId
    ),
    createdAt: apiTransaction.createdAt,
    updatedAt: apiTransaction.updatedAt
  };
};

export const useTransactionsApi = () => {
  const api = useApi();

  return {
    async listTransactions(): Promise<Transaction[]> {
      const response = await api.request<ApiTransaction[]>(TRANSACTIONS_ENDPOINT);

      if (!Array.isArray(response)) {
        throw new Error('Invalid API response: expected a transaction array.');
      }

      return response.map(normalizeTransaction);
    },

    async createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
      const response = await api.request<ApiTransaction>(TRANSACTIONS_ENDPOINT, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: payload
      });

      return normalizeTransaction(response);
    },

    async updateTransactionStage(id: string, stage: TransactionStage): Promise<Transaction> {
      const response = await api.request<ApiTransaction>(TRANSACTION_STAGE_ENDPOINT(id), {
        method: 'PATCH',
        body: { stage }
      });

      return normalizeTransaction(response);
    },

    async getCompletedEarningsSummary(): Promise<CompletedTransactionEarningsSummary> {
      const response = await api.request<ApiCompletedTransactionEarningsSummary>(
        TRANSACTIONS_SUMMARY_ENDPOINT
      );

      return {
        totalAgencyEarnings: toRequiredNonNegativeNumber(
          response.totalAgencyEarnings,
          'totalAgencyEarnings'
        ),
        totalAgentEarnings: toRequiredNonNegativeNumber(
          response.totalAgentEarnings,
          'totalAgentEarnings'
        ),
        byAgent: (response.byAgent ?? []).map((item, index) => ({
          agentId: toRequiredObjectIdString(item.agentId, `byAgent[${index}].agentId`),
          earnings: toRequiredNonNegativeNumber(item.earnings, `byAgent[${index}].earnings`)
        }))
      };
    }
  };
};
