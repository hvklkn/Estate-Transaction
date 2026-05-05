import type {
  AgentCommissionAllocation,
  AgentSummary,
  CompletedTransactionEarningsSummary,
  CreateTransactionPayload,
  FinancialBreakdown,
  PaginatedTransactionsResponse,
  Transaction,
  TransactionListQueryParams,
  TransactionStageHistoryItem,
  TransactionStage,
  TransactionType,
  UpdateTransactionPayload
} from '~/types/transaction';
import { TransactionStage as TransactionStageEnum, TransactionType as TransactionTypeEnum } from '~/types/transaction';
import { normalizeClientSummary } from '~/services/clients.api';
import { normalizePropertySummary } from '~/services/properties.api';

const TRANSACTIONS_ENDPOINT = '/transactions';
const TRANSACTION_ENDPOINT = (id: string) => `${TRANSACTIONS_ENDPOINT}/${id}`;
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
  propertyId?: string | Record<string, unknown> | null;
  clientIds?: Array<string | Record<string, unknown>>;
  totalServiceFee?: number;
  listingAgentId?: string | ApiAgent;
  sellingAgentId?: string | ApiAgent;
  transactionType?: TransactionType;
  createdBy?: string | ApiAgent | null;
  updatedBy?: string | ApiAgent | null;
  deletedBy?: string | ApiAgent | null;
  stage?: TransactionStage;
  stageHistory?: ApiTransactionStageHistoryItem[];
  financialBreakdown?: ApiFinancialBreakdown;
  balanceDistributionApplied?: boolean;
  balanceDistributionAppliedAt?: string | null;
  balanceDistributionAppliedBy?: ObjectIdLike | ApiAgent | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
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

interface ApiPaginatedTransactionsResponse {
  items?: ApiTransaction[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
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

const toRequiredIntegerAtLeast = (value: unknown, fieldName: string, min: number): number => {
  const normalizedValue = toRequiredNumber(value, fieldName);

  if (!Number.isInteger(normalizedValue) || normalizedValue < min) {
    throw new Error(`Invalid API response: "${fieldName}" must be an integer >= ${min}.`);
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

const resolveOptionalObjectIdReference = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return OBJECT_ID_REGEX.test(value) ? value : null;
  }

  if (isObject(value)) {
    const record = value as Record<string, unknown>;
    const fromKnownKeys = toOptionalObjectIdString(record.id ?? record._id);
    if (fromKnownKeys && OBJECT_ID_REGEX.test(fromKnownKeys)) {
      return fromKnownKeys;
    }

    const fromToString = toOptionalObjectIdString(value);
    if (fromToString && OBJECT_ID_REGEX.test(fromToString)) {
      return fromToString;
    }
  }

  return null;
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

const normalizeOptionalIsoDate = (value: unknown, fieldName: string): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const stringValue = toRequiredString(value, fieldName);
  const dateValue = new Date(stringValue);
  if (Number.isNaN(dateValue.getTime())) {
    throw new Error(`Invalid API response: invalid "${fieldName}".`);
  }

  return dateValue.toISOString();
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

const normalizeListQueryParams = (
  params: TransactionListQueryParams
): Record<string, string | number> => {
  const query: Record<string, string | number> = {};

  if (typeof params.page === 'number') {
    query.page = params.page;
  }

  if (typeof params.limit === 'number') {
    query.limit = params.limit;
  }

  const normalizedSearch = typeof params.search === 'string' ? params.search.trim() : '';
  if (normalizedSearch) {
    query.search = normalizedSearch;
  }

  if (params.stage) {
    query.stage = params.stage;
  }

  if (params.transactionType) {
    query.transactionType = params.transactionType;
  }

  if (params.sortBy) {
    query.sortBy = params.sortBy;
  }

  if (params.sortOrder) {
    query.sortOrder = params.sortOrder;
  }

  if (typeof params.includeDeleted === 'boolean') {
    query.includeDeleted = params.includeDeleted ? 'true' : 'false';
  }

  return query;
};

const normalizePaginatedTransactionsResponse = (
  response: ApiPaginatedTransactionsResponse
): PaginatedTransactionsResponse => {
  if (!Array.isArray(response.items)) {
    throw new Error('Invalid API response: expected "items" array in paginated response.');
  }

  return {
    items: response.items.map(normalizeTransaction),
    page: toRequiredIntegerAtLeast(response.page, 'page', 1),
    limit: toRequiredIntegerAtLeast(response.limit, 'limit', 1),
    total: toRequiredIntegerAtLeast(response.total, 'total', 0),
    totalPages: toRequiredIntegerAtLeast(response.totalPages, 'totalPages', 0)
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
  let updatedById: string | null = null;
  let updatedBy: AgentSummary | undefined;
  let deletedById: string | null = null;
  let deletedBy: AgentSummary | undefined;
  let balanceDistributionAppliedById: string | null | undefined;
  const propertyId = resolveOptionalObjectIdReference(apiTransaction.propertyId);
  const property =
    apiTransaction.propertyId && typeof apiTransaction.propertyId !== 'string'
      ? normalizePropertySummary(apiTransaction.propertyId as never)
      : undefined;
  const clientIds = (apiTransaction.clientIds ?? [])
    .map((clientReference) => resolveOptionalObjectIdReference(clientReference))
    .filter((clientId): clientId is string => Boolean(clientId));
  const clients = (apiTransaction.clientIds ?? [])
    .filter((clientReference) => typeof clientReference !== 'string')
    .map((clientReference) => normalizeClientSummary(clientReference as never));

  if (apiTransaction.createdBy) {
    const normalizedCreatedById = resolveOptionalObjectIdReference(apiTransaction.createdBy);
    if (normalizedCreatedById) {
      createdById = normalizedCreatedById;
      if (typeof apiTransaction.createdBy !== 'string') {
        createdBy = normalizeAgentSummary(apiTransaction.createdBy, createdById);
      }
    }
  }

  if (apiTransaction.updatedBy) {
    const normalizedUpdatedById = resolveOptionalObjectIdReference(apiTransaction.updatedBy);
    if (normalizedUpdatedById) {
      updatedById = normalizedUpdatedById;
      if (typeof apiTransaction.updatedBy !== 'string') {
        updatedBy = normalizeAgentSummary(apiTransaction.updatedBy, normalizedUpdatedById);
      }
    }
  }

  if (apiTransaction.deletedBy) {
    const normalizedDeletedById = resolveOptionalObjectIdReference(apiTransaction.deletedBy);
    if (normalizedDeletedById) {
      deletedById = normalizedDeletedById;
      if (typeof apiTransaction.deletedBy !== 'string') {
        deletedBy = normalizeAgentSummary(apiTransaction.deletedBy, normalizedDeletedById);
      }
    }
  }

  balanceDistributionAppliedById =
    resolveOptionalObjectIdReference(apiTransaction.balanceDistributionAppliedBy) ?? null;

  return {
    id: transactionId,
    propertyTitle: toRequiredString(apiTransaction.propertyTitle, 'propertyTitle'),
    propertyId,
    clientIds,
    totalServiceFee: toRequiredNonNegativeNumber(apiTransaction.totalServiceFee, 'totalServiceFee'),
    listingAgentId,
    sellingAgentId,
    transactionType: normalizeTransactionType(apiTransaction.transactionType),
    createdById,
    updatedById,
    deletedById,
    listingAgent: normalizeAgentSummary(apiTransaction.listingAgentId, listingAgentId),
    sellingAgent: normalizeAgentSummary(apiTransaction.sellingAgentId, sellingAgentId),
    property,
    clients,
    createdBy,
    updatedBy,
    deletedBy,
    stage: normalizeStage(apiTransaction.stage),
    stageHistory: normalizeStageHistory(apiTransaction.stageHistory),
    financialBreakdown: normalizeFinancialBreakdown(
      apiTransaction.financialBreakdown,
      listingAgentId,
      sellingAgentId
    ),
    balanceDistributionApplied: Boolean(apiTransaction.balanceDistributionApplied),
    balanceDistributionAppliedAt: normalizeOptionalIsoDate(
      apiTransaction.balanceDistributionAppliedAt,
      'balanceDistributionAppliedAt'
    ),
    balanceDistributionAppliedById,
    isDeleted: Boolean(apiTransaction.isDeleted),
    deletedAt: normalizeOptionalIsoDate(apiTransaction.deletedAt, 'deletedAt'),
    createdAt: apiTransaction.createdAt,
    updatedAt: apiTransaction.updatedAt
  };
};

export const useTransactionsApi = () => {
  const api = useApi();

  return {
    async listTransactions(
      params: TransactionListQueryParams = {}
    ): Promise<PaginatedTransactionsResponse> {
      const response = await api.request<ApiPaginatedTransactionsResponse>(TRANSACTIONS_ENDPOINT, {
        headers: createAuthHeaders(),
        query: normalizeListQueryParams(params)
      });

      return normalizePaginatedTransactionsResponse(response);
    },

    async createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
      const response = await api.request<ApiTransaction>(TRANSACTIONS_ENDPOINT, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: payload
      });

      return normalizeTransaction(response);
    },

    async updateTransaction(id: string, payload: UpdateTransactionPayload): Promise<Transaction> {
      const response = await api.request<ApiTransaction>(TRANSACTION_ENDPOINT(id), {
        method: 'PATCH',
        headers: createAuthHeaders(),
        body: payload
      });

      return normalizeTransaction(response);
    },

    async deleteTransaction(id: string): Promise<{ success: boolean }> {
      const response = await api.request<{ success?: boolean }>(TRANSACTION_ENDPOINT(id), {
        method: 'DELETE',
        headers: createAuthHeaders()
      });

      return {
        success: Boolean(response.success)
      };
    },

    async updateTransactionStage(id: string, stage: TransactionStage): Promise<Transaction> {
      const response = await api.request<ApiTransaction>(TRANSACTION_STAGE_ENDPOINT(id), {
        method: 'PATCH',
        headers: createAuthHeaders(),
        body: { stage }
      });

      return normalizeTransaction(response);
    },

    async getCompletedEarningsSummary(): Promise<CompletedTransactionEarningsSummary> {
      const response = await api.request<ApiCompletedTransactionEarningsSummary>(
        TRANSACTIONS_SUMMARY_ENDPOINT,
        {
          headers: createAuthHeaders()
        }
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
