import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { toApiErrorMessage } from '~/services/api.errors';
import { useBalanceApi } from '~/services/balance.api';
import type {
  BalanceLedgerQuery,
  BalanceLedgerType,
  BalanceSummary,
  PaginatedBalanceLedger
} from '~/types/balance';

interface BalanceLedgerQueryState {
  page: number;
  limit: number;
  type: BalanceLedgerType | null;
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_LEDGER_QUERY_STATE: BalanceLedgerQueryState = {
  page: 1,
  limit: 20,
  type: null,
  dateFrom: '',
  dateTo: ''
};

const EMPTY_LEDGER_PAGE: PaginatedBalanceLedger = {
  items: [],
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
};

const toLedgerQueryParams = (query: BalanceLedgerQueryState): BalanceLedgerQuery => ({
  page: query.page,
  limit: query.limit,
  type: query.type ?? undefined,
  dateFrom: query.dateFrom || undefined,
  dateTo: query.dateTo || undefined
});

export const useBalanceStore = defineStore('balance', () => {
  const api = useBalanceApi();

  const summary = ref<BalanceSummary | null>(null);
  const ledger = ref<PaginatedBalanceLedger>({ ...EMPTY_LEDGER_PAGE });
  const isLoadingSummary = ref(false);
  const isLoadingLedger = ref(false);
  const isAdjusting = ref(false);
  const summaryError = ref<string | null>(null);
  const ledgerError = ref<string | null>(null);
  const adjustmentError = ref<string | null>(null);
  const queryState = ref<BalanceLedgerQueryState>({ ...DEFAULT_LEDGER_QUERY_STATE });

  const hasSummary = computed(() => summary.value !== null);
  const hasLedger = computed(() => ledger.value.items.length > 0);
  const hasLedgerFilters = computed(
    () => Boolean(queryState.value.type) || Boolean(queryState.value.dateFrom) || Boolean(queryState.value.dateTo)
  );

  const setSummaryError = (value: string | null) => {
    summaryError.value = value;
  };

  const setLedgerError = (value: string | null) => {
    ledgerError.value = value;
  };

  const setAdjustmentError = (value: string | null) => {
    adjustmentError.value = value;
  };

  const fetchSummary = async () => {
    isLoadingSummary.value = true;
    setSummaryError(null);

    try {
      summary.value = await api.getMyBalance();
    } catch (unknownError) {
      setSummaryError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      isLoadingSummary.value = false;
    }
  };

  const fetchLedger = async (options: { query?: Partial<BalanceLedgerQueryState> } = {}) => {
    const nextQueryState: BalanceLedgerQueryState = {
      ...queryState.value,
      ...options.query,
      page: Math.max(1, Number(options.query?.page ?? queryState.value.page)),
      limit: Math.max(1, Number(options.query?.limit ?? queryState.value.limit))
    };

    isLoadingLedger.value = true;
    setLedgerError(null);

    try {
      const response = await api.getMyLedger(toLedgerQueryParams(nextQueryState));
      ledger.value = response;
      queryState.value = {
        ...nextQueryState,
        page: response.page,
        limit: response.limit
      };
    } catch (unknownError) {
      setLedgerError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      isLoadingLedger.value = false;
    }
  };

  const refresh = async () => {
    await Promise.all([fetchSummary(), fetchLedger()]);
  };

  const createManualAdjustment = async (payload: {
    userId: string;
    amount: number;
    description: string;
    transactionId?: string;
  }) => {
    isAdjusting.value = true;
    setAdjustmentError(null);

    try {
      const result = await api.createManualAdjustment(payload);
      await refresh();
      return result;
    } catch (unknownError) {
      setAdjustmentError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      isAdjusting.value = false;
    }
  };

  const resetLedgerFilters = async () => {
    await fetchLedger({
      query: {
        page: 1,
        type: null,
        dateFrom: '',
        dateTo: ''
      }
    });
  };

  return {
    summary,
    ledger,
    queryState,
    isLoadingSummary,
    isLoadingLedger,
    isAdjusting,
    summaryError,
    ledgerError,
    adjustmentError,
    hasSummary,
    hasLedger,
    hasLedgerFilters,
    fetchSummary,
    fetchLedger,
    refresh,
    createManualAdjustment,
    resetLedgerFilters,
    setSummaryError,
    setLedgerError,
    setAdjustmentError
  };
});
