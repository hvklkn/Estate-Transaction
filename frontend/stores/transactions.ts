import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { toApiErrorMessage } from '~/services/api.errors';
import { useTransactionsApi } from '~/services/transactions.api';
import {
  TRANSACTION_STAGE_ORDER,
  TransactionStage,
  type CreateTransactionPayload,
  type Transaction
} from '~/types/transaction';

export const useTransactionsStore = defineStore('transactions', () => {
  const api = useTransactionsApi();

  const items = ref<Transaction[]>([]);
  const isLoading = ref(false);
  const isCreating = ref(false);
  const stageUpdateTransactionId = ref<string | null>(null);
  const error = ref<string | null>(null);
  const hasLoaded = ref(false);

  const count = computed(() => items.value.length);
  const openTransactionsCount = computed(
    () =>
      items.value.filter(
        (transaction) => transaction.stage !== TransactionStage.COMPLETED
      )
        .length
  );
  const completedTransactionsCount = computed(
    () =>
      items.value.filter(
        (transaction) => transaction.stage === TransactionStage.COMPLETED
      )
        .length
  );
  const pendingClosingsCount = computed(
    () =>
      items.value.filter(
        (transaction) => transaction.stage === TransactionStage.TITLE_DEED
      )
        .length
  );
  const commissionPipelineAmount = computed(() =>
    items.value.reduce((sum, transaction) => sum + transaction.totalServiceFee, 0)
  );

  const getNextStage = (stage: TransactionStage): TransactionStage | null => {
    const stageIndex = TRANSACTION_STAGE_ORDER.indexOf(stage);

    if (stageIndex === -1) {
      return null;
    }

    return TRANSACTION_STAGE_ORDER[stageIndex + 1] ?? null;
  };

  const upsertTransaction = (transaction: Transaction) => {
    const index = items.value.findIndex((item) => item.id === transaction.id);

    if (index === -1) {
      items.value.unshift(transaction);
      return;
    }

    items.value[index] = transaction;
  };

  const setError = (message: string | null) => {
    error.value = message;
  };

  const fetchTransactions = async (options: { force?: boolean } = {}) => {
    const { force = false } = options;

    if (isLoading.value) {
      return;
    }

    if (hasLoaded.value && !force) {
      return;
    }

    isLoading.value = true;
    setError(null);

    try {
      items.value = await api.listTransactions();
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
      upsertTransaction(transaction);
      hasLoaded.value = true;
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
      upsertTransaction(transaction);
      hasLoaded.value = true;
      return transaction;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      stageUpdateTransactionId.value = null;
    }
  };

  return {
    items,
    isLoading,
    isCreating,
    stageUpdateTransactionId,
    error,
    hasLoaded,
    count,
    openTransactionsCount,
    completedTransactionsCount,
    pendingClosingsCount,
    commissionPipelineAmount,
    getNextStage,
    fetchTransactions,
    refreshTransactions,
    createTransaction,
    updateTransactionStage,
    setError
  };
});
