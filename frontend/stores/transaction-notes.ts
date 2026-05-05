import { ref } from 'vue';
import { defineStore } from 'pinia';

import { toApiErrorMessage } from '~/services/api.errors';
import { useTransactionNotesApi } from '~/services/transaction-notes.api';
import type { TransactionNote } from '~/types/transaction-note';

export const useTransactionNotesStore = defineStore('transactionNotes', () => {
  const api = useTransactionNotesApi();

  const notesByTransactionId = ref<Record<string, TransactionNote[]>>({});
  const recentItems = ref<TransactionNote[]>([]);
  const loadingTransactionId = ref<string | null>(null);
  const createNoteTransactionId = ref<string | null>(null);
  const error = ref<string | null>(null);

  const setError = (message: string | null) => {
    error.value = message;
  };

  const fetchNotesForTransaction = async (transactionId: string) => {
    loadingTransactionId.value = transactionId;
    setError(null);

    try {
      notesByTransactionId.value = {
        ...notesByTransactionId.value,
        [transactionId]: await api.listNotes({ transactionId })
      };
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
    } finally {
      loadingTransactionId.value = null;
    }
  };

  const fetchRecentNotes = async () => {
    try {
      recentItems.value = await api.listRecentNotes(8);
    } catch {
      recentItems.value = [];
    }
  };

  const createNote = async (transactionId: string, content: string) => {
    createNoteTransactionId.value = transactionId;
    setError(null);

    try {
      const note = await api.createNote({ transactionId, content });
      await Promise.all([fetchNotesForTransaction(transactionId), fetchRecentNotes()]);
      return note;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      createNoteTransactionId.value = null;
    }
  };

  return {
    notesByTransactionId,
    recentItems,
    loadingTransactionId,
    createNoteTransactionId,
    error,
    fetchNotesForTransaction,
    fetchRecentNotes,
    createNote,
    setError
  };
});
