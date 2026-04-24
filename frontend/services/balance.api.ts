import type {
  BalanceLedgerEntry,
  BalanceLedgerQuery,
  BalanceLedgerType,
  BalanceSummary,
  PaginatedBalanceLedger
} from '~/types/balance';

const BALANCE_ME_ENDPOINT = '/balance/me';
const BALANCE_ME_LEDGER_ENDPOINT = '/balance/me/ledger';
const BALANCE_MANUAL_ADJUSTMENT_ENDPOINT = '/balance/manual-adjustment';
const AGENT_BALANCE_ENDPOINT = (agentId: string) => `/agents/${agentId}/balance`;
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

type ObjectIdLike = string | { toString(): string };

interface ApiBalanceLedgerEntry {
  id?: ObjectIdLike;
  userId?: ObjectIdLike;
  transactionId?: ObjectIdLike | null;
  type?: BalanceLedgerType;
  amount?: number;
  amountCents?: number;
  previousBalance?: number;
  previousBalanceCents?: number;
  newBalance?: number;
  newBalanceCents?: number;
  description?: string;
  createdAt?: string;
  createdBy?: ObjectIdLike;
}

interface ApiBalanceSummary {
  userId?: ObjectIdLike;
  balance?: number;
  balanceCents?: number;
  totalEarned?: number;
  totalEarnedCents?: number;
  recentLedgerEntries?: ApiBalanceLedgerEntry[];
}

interface ApiPaginatedBalanceLedger {
  items?: ApiBalanceLedgerEntry[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const nextValue = value.trim();
  return nextValue.length > 0 ? nextValue : null;
};

const toRequiredString = (value: unknown, fieldName: string): string => {
  const nextValue = toNonEmptyString(value);
  if (!nextValue) {
    throw new Error(`Invalid API response: missing or invalid "${fieldName}".`);
  }

  return nextValue;
};

const toRequiredNumber = (value: unknown, fieldName: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid API response: missing or invalid "${fieldName}".`);
  }

  return value;
};

const toRequiredInteger = (value: unknown, fieldName: string, min = 0): number => {
  const nextValue = toRequiredNumber(value, fieldName);
  if (!Number.isInteger(nextValue) || nextValue < min) {
    throw new Error(`Invalid API response: "${fieldName}" must be an integer >= ${min}.`);
  }

  return nextValue;
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
  const normalized = toOptionalObjectIdString(value);
  if (!normalized || !OBJECT_ID_REGEX.test(normalized)) {
    throw new Error(`Invalid API response: missing or invalid "${fieldName}".`);
  }

  return normalized;
};

const readSessionTokenFromStorage = (): string | null => {
  if (!import.meta.client) {
    return null;
  }

  const token = window.localStorage.getItem('iceberg.session-token');
  if (typeof token !== 'string') {
    return null;
  }

  const normalized = token.trim();
  return normalized.length > 0 ? normalized : null;
};

const createAuthHeaders = (): HeadersInit => {
  const token = readSessionTokenFromStorage();
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`
  };
};

const normalizeLedgerType = (value: unknown): BalanceLedgerType => {
  if (
    value === 'commission_credit' ||
    value === 'manual_adjustment' ||
    value === 'reversal'
  ) {
    return value;
  }

  throw new Error('Invalid API response: unknown ledger type.');
};

const normalizeLedgerEntry = (entry: ApiBalanceLedgerEntry, index: number): BalanceLedgerEntry => ({
  id: toRequiredObjectIdString(entry.id, `items[${index}].id`),
  userId: toRequiredObjectIdString(entry.userId, `items[${index}].userId`),
  transactionId: entry.transactionId
    ? toRequiredObjectIdString(entry.transactionId, `items[${index}].transactionId`)
    : null,
  type: normalizeLedgerType(entry.type),
  amount: toRequiredNumber(entry.amount, `items[${index}].amount`),
  amountCents: toRequiredInteger(entry.amountCents, `items[${index}].amountCents`),
  previousBalance: toRequiredNumber(entry.previousBalance, `items[${index}].previousBalance`),
  previousBalanceCents: toRequiredInteger(
    entry.previousBalanceCents,
    `items[${index}].previousBalanceCents`
  ),
  newBalance: toRequiredNumber(entry.newBalance, `items[${index}].newBalance`),
  newBalanceCents: toRequiredInteger(entry.newBalanceCents, `items[${index}].newBalanceCents`),
  description: toRequiredString(entry.description, `items[${index}].description`),
  createdAt: toRequiredString(entry.createdAt, `items[${index}].createdAt`),
  createdBy: toRequiredObjectIdString(entry.createdBy, `items[${index}].createdBy`)
});

const normalizeLedgerQuery = (query: BalanceLedgerQuery): Record<string, string | number> => {
  const params: Record<string, string | number> = {};

  if (typeof query.page === 'number') {
    params.page = query.page;
  }
  if (typeof query.limit === 'number') {
    params.limit = query.limit;
  }
  if (query.type) {
    params.type = query.type;
  }
  if (query.dateFrom) {
    params.dateFrom = query.dateFrom;
  }
  if (query.dateTo) {
    params.dateTo = query.dateTo;
  }

  return params;
};

export const useBalanceApi = () => {
  const api = useApi();

  return {
    async getMyBalance(): Promise<BalanceSummary> {
      const response = await api.request<ApiBalanceSummary>(BALANCE_ME_ENDPOINT, {
        headers: createAuthHeaders()
      });

      const recentLedgerEntries = Array.isArray(response.recentLedgerEntries)
        ? response.recentLedgerEntries.map((entry, index) => normalizeLedgerEntry(entry, index))
        : [];

      return {
        userId: toRequiredObjectIdString(response.userId, 'userId'),
        balance: toRequiredNumber(response.balance, 'balance'),
        balanceCents: toRequiredInteger(response.balanceCents, 'balanceCents'),
        totalEarned: toRequiredNumber(response.totalEarned, 'totalEarned'),
        totalEarnedCents: toRequiredInteger(response.totalEarnedCents, 'totalEarnedCents'),
        recentLedgerEntries
      };
    },

    async getMyLedger(query: BalanceLedgerQuery = {}): Promise<PaginatedBalanceLedger> {
      const response = await api.request<ApiPaginatedBalanceLedger>(BALANCE_ME_LEDGER_ENDPOINT, {
        headers: createAuthHeaders(),
        query: normalizeLedgerQuery(query)
      });

      const items = Array.isArray(response.items)
        ? response.items.map((entry, index) => normalizeLedgerEntry(entry, index))
        : [];

      return {
        items,
        page: toRequiredInteger(response.page, 'page', 1),
        limit: toRequiredInteger(response.limit, 'limit', 1),
        total: toRequiredInteger(response.total, 'total', 0),
        totalPages: toRequiredInteger(response.totalPages, 'totalPages', 0)
      };
    },

    async getAgentBalance(agentId: string): Promise<BalanceSummary> {
      const response = await api.request<ApiBalanceSummary>(AGENT_BALANCE_ENDPOINT(agentId), {
        headers: createAuthHeaders()
      });

      return {
        userId: toRequiredObjectIdString(response.userId, 'userId'),
        balance: toRequiredNumber(response.balance, 'balance'),
        balanceCents: toRequiredInteger(response.balanceCents, 'balanceCents'),
        totalEarned: toRequiredNumber(response.totalEarned, 'totalEarned'),
        totalEarnedCents: toRequiredInteger(response.totalEarnedCents, 'totalEarnedCents'),
        recentLedgerEntries: (response.recentLedgerEntries ?? []).map((entry, index) =>
          normalizeLedgerEntry(entry, index)
        )
      };
    },

    async createManualAdjustment(payload: {
      userId: string;
      amount: number;
      description: string;
      transactionId?: string;
    }) {
      return api.request(BALANCE_MANUAL_ADJUSTMENT_ENDPOINT, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: payload
      });
    }
  };
};
