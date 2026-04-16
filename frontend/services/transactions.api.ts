import type {
  AgentCommissionAllocation,
  AgentSummary,
  CreateTransactionPayload,
  FinancialBreakdown,
  Transaction,
  TransactionStage
} from '~/types/transaction';
import { TransactionStage as TransactionStageEnum } from '~/types/transaction';

const TRANSACTIONS_ENDPOINT = '/transactions';
const TRANSACTION_STAGE_ENDPOINT = (id: string) => `${TRANSACTIONS_ENDPOINT}/${id}/stage`;
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
  stage?: TransactionStage;
  financialBreakdown?: ApiFinancialBreakdown;
  createdAt?: string;
  updatedAt?: string;
}

const TRANSACTION_STAGE_SET = new Set(Object.values(TransactionStageEnum));
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

  return {
    id: transactionId,
    propertyTitle: toRequiredString(apiTransaction.propertyTitle, 'propertyTitle'),
    totalServiceFee: toRequiredNonNegativeNumber(apiTransaction.totalServiceFee, 'totalServiceFee'),
    listingAgentId,
    sellingAgentId,
    listingAgent: normalizeAgentSummary(apiTransaction.listingAgentId, listingAgentId),
    sellingAgent: normalizeAgentSummary(apiTransaction.sellingAgentId, sellingAgentId),
    stage: normalizeStage(apiTransaction.stage),
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
    }
  };
};
