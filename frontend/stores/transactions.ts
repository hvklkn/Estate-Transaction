import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { toApiErrorMessage } from '~/services/api.errors';
import { useTransactionsApi } from '~/services/transactions.api';
import {
  type CompletedTransactionEarningsSummary,
  TRANSACTION_STAGE_ORDER,
  TransactionStage,
  type CreateTransactionPayload,
  type Transaction,
  type TransactionListQueryParams,
  type TransactionSortBy,
  type TransactionSortOrder,
  type TransactionType,
  type UpdateTransactionPayload
} from '~/types/transaction';

export interface TransactionsQueryState {
  page: number;
  limit: number;
  search: string;
  stage: TransactionStage | null;
  transactionType: TransactionType | null;
  sortBy: TransactionSortBy;
  sortOrder: TransactionSortOrder;
  includeDeleted: boolean;
}

const DEFAULT_QUERY_STATE: TransactionsQueryState = {
  page: 1,
  limit: 20,
  search: '',
  stage: null,
  transactionType: null,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  includeDeleted: false
};

const normalizeQueryState = (query: Partial<TransactionsQueryState>): TransactionsQueryState => ({
  page: Math.max(1, Number.isFinite(query.page ?? NaN) ? Number(query.page) : DEFAULT_QUERY_STATE.page),
  limit: Math.max(1, Number.isFinite(query.limit ?? NaN) ? Number(query.limit) : DEFAULT_QUERY_STATE.limit),
  search: typeof query.search === 'string' ? query.search.trim() : DEFAULT_QUERY_STATE.search,
  stage: query.stage ?? DEFAULT_QUERY_STATE.stage,
  transactionType: query.transactionType ?? DEFAULT_QUERY_STATE.transactionType,
  sortBy: query.sortBy ?? DEFAULT_QUERY_STATE.sortBy,
  sortOrder: query.sortOrder ?? DEFAULT_QUERY_STATE.sortOrder,
  includeDeleted:
    typeof query.includeDeleted === 'boolean'
      ? query.includeDeleted
      : DEFAULT_QUERY_STATE.includeDeleted
});

const toApiQueryParams = (queryState: TransactionsQueryState): TransactionListQueryParams => ({
  page: queryState.page,
  limit: queryState.limit,
  search: queryState.search || undefined,
  stage: queryState.stage ?? undefined,
  transactionType: queryState.transactionType ?? undefined,
  sortBy: queryState.sortBy,
  sortOrder: queryState.sortOrder,
  includeDeleted: queryState.includeDeleted || undefined
});

export const useTransactionsStore = defineStore('transactions', () => {
  const api = useTransactionsApi();

  const items = ref<Transaction[]>([]);
  const isLoading = ref(false);
  const isCreating = ref(false);
  const updateTransactionId = ref<string | null>(null);
  const deleteTransactionId = ref<string | null>(null);
  const stageUpdateTransactionId = ref<string | null>(null);
  const error = ref<string | null>(null);
  const hasLoaded = ref(false);
  const queryState = ref<TransactionsQueryState>({ ...DEFAULT_QUERY_STATE });
  const pagination = ref({
    page: DEFAULT_QUERY_STATE.page,
    limit: DEFAULT_QUERY_STATE.limit,
    total: 0,
    totalPages: 0
  });
  const completedEarningsSummary = ref<CompletedTransactionEarningsSummary>({
    totalAgencyEarnings: 0,
    totalAgentEarnings: 0,
    byAgent: []
  });

  const count = computed(() => items.value.length);
  const openTransactionsCount = computed(
    () =>
      items.value.filter(
        (transaction) => transaction.stage !== TransactionStage.COMPLETED
      ).length
  );
  const completedTransactionsCount = computed(
    () =>
      items.value.filter(
        (transaction) => transaction.stage === TransactionStage.COMPLETED
      ).length
  );
  const pendingClosingsCount = computed(
    () =>
      items.value.filter(
        (transaction) => transaction.stage === TransactionStage.TITLE_DEED
      ).length
  );
  const commissionPipelineAmount = computed(() =>
    items.value.reduce((sum, transaction) => sum + transaction.totalServiceFee, 0)
  );
  const hasActiveFilters = computed(
    () =>
      Boolean(queryState.value.search) ||
      Boolean(queryState.value.stage) ||
      Boolean(queryState.value.transactionType) ||
      queryState.value.includeDeleted
  );

  const getNextStage = (stage: TransactionStage): TransactionStage | null => {
    const stageIndex = TRANSACTION_STAGE_ORDER.indexOf(stage);

    if (stageIndex === -1) {
      return null;
    }

    return TRANSACTION_STAGE_ORDER[stageIndex + 1] ?? null;
  };

  const setError = (message: string | null) => {
    error.value = message;
  };

  const fetchTransactions = async (
    options: {
      force?: boolean;
      query?: Partial<TransactionsQueryState>;
    } = {}
  ) => {
    const { force = false, query } = options;

    if (isLoading.value) {
      return;
    }

    if (hasLoaded.value && !force && !query) {
      return;
    }

    const nextQueryState = normalizeQueryState({
      ...queryState.value,
      ...query
    });

    isLoading.value = true;
    setError(null);

    try {
      const [transactionsResponse, completedSummary] = await Promise.all([
        api.listTransactions(toApiQueryParams(nextQueryState)),
        api.getCompletedEarningsSummary().catch(() => ({
          totalAgencyEarnings: 0,
          totalAgentEarnings: 0,
          byAgent: []
        }))
      ]);

      items.value = transactionsResponse.items;
      queryState.value = {
        ...nextQueryState,
        page: transactionsResponse.page,
        limit: transactionsResponse.limit
      };
      pagination.value = {
        page: transactionsResponse.page,
        limit: transactionsResponse.limit,
        total: transactionsResponse.total,
        totalPages: transactionsResponse.totalPages
      };
      completedEarningsSummary.value = completedSummary;
      hasLoaded.value = true;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
    } finally {
      isLoading.value = false;
    }
  };

  const refreshTransactions = async () => {
    await fetchTransactions({ force: true });
  };

  const createTransaction = async (payload: CreateTransactionPayload) => {
    isCreating.value = true;
    setError(null);

    try {
      const transaction = await api.createTransaction(payload);
      await fetchTransactions({
        force: true,
        query: {
          page: 1
        }
      });
      return transaction;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      isCreating.value = false;
    }
  };

  const updateTransactionStage = async (id: string, stage: TransactionStage) => {
    stageUpdateTransactionId.value = id;
    setError(null);

    try {
      const transaction = await api.updateTransactionStage(id, stage);
      await fetchTransactions({ force: true });
      return transaction;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      stageUpdateTransactionId.value = null;
    }
  };

  const updateTransaction = async (id: string, payload: UpdateTransactionPayload) => {
    updateTransactionId.value = id;
    setError(null);

    try {
      const transaction = await api.updateTransaction(id, payload);
      await fetchTransactions({ force: true });
      return transaction;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      updateTransactionId.value = null;
    }
  };

  const deleteTransaction = async (id: string) => {
    deleteTransactionId.value = id;
    setError(null);

    try {
      const result = await api.deleteTransaction(id);
      const nextPage =
        queryState.value.page > 1 &&
        items.value.length === 1 &&
        pagination.value.total > 1
          ? queryState.value.page - 1
          : queryState.value.page;

      await fetchTransactions({
        force: true,
        query: {
          page: nextPage
        }
      });
      return result;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      deleteTransactionId.value = null;
    }
  };

  return {
    items,
    isLoading,
    isCreating,
    updateTransactionId,
    deleteTransactionId,
    stageUpdateTransactionId,
    error,
    hasLoaded,
    completedEarningsSummary,
    queryState,
    pagination,
    count,
    openTransactionsCount,
    completedTransactionsCount,
    pendingClosingsCount,
    commissionPipelineAmount,
    hasActiveFilters,
    getNextStage,
    fetchTransactions,
    refreshTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    updateTransactionStage,
    setError
  };
});
