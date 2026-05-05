import { ref } from 'vue';
import { defineStore } from 'pinia';

import { toApiErrorMessage } from '~/services/api.errors';
import { useReportsApi } from '~/services/reports.api';
import type { ReportExportKind, ReportFilters, ReportsSummary } from '~/types/report';

const DEFAULT_SUMMARY: ReportsSummary = {
  filters: {
    dateFrom: null,
    dateTo: null,
    agentId: null,
    transactionType: null,
    transactionStage: null,
    propertyListingType: null,
    status: null
  },
  transactionCountsByStage: [],
  transactionCountsByType: [],
  completedDealsOverTime: [],
  totalServiceFeeOverTime: [],
  monthlyServiceFee: 0,
  monthlyServiceFeeCents: 0,
  agentPerformance: [],
  taskSummary: {
    pending: 0,
    completed: 0,
    overdue: 0
  },
  recentActivity: [],
  commissionSummary: {
    agencyTotal: 0,
    agencyTotalCents: 0,
    agentPoolTotal: 0,
    agentPoolTotalCents: 0,
    agentEarningsTotal: 0,
    agentEarningsTotalCents: 0
  }
};

export const useReportsStore = defineStore('reports', () => {
  const api = useReportsApi();

  const summary = ref<ReportsSummary>({ ...DEFAULT_SUMMARY });
  const filters = ref<ReportFilters>({});
  const isLoading = ref(false);
  const exportKind = ref<ReportExportKind | null>(null);
  const error = ref<string | null>(null);

  const setError = (message: string | null) => {
    error.value = message;
  };

  const fetchSummary = async (nextFilters: ReportFilters = filters.value) => {
    if (isLoading.value) {
      return;
    }

    isLoading.value = true;
    setError(null);

    try {
      filters.value = { ...nextFilters };
      summary.value = await api.getSummary(filters.value);
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
    } finally {
      isLoading.value = false;
    }
  };

  const exportCsv = async (kind: ReportExportKind) => {
    exportKind.value = kind;
    setError(null);

    try {
      await api.exportCsv(kind, filters.value);
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
    } finally {
      exportKind.value = null;
    }
  };

  return {
    summary,
    filters,
    isLoading,
    exportKind,
    error,
    fetchSummary,
    exportCsv,
    setError
  };
});
