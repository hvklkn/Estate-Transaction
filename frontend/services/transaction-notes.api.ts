import {
  createStoredAuthHeaders,
  isObject,
  normalizeAgentSummary,
  normalizeOptionalIsoDate,
  toOptionalObjectIdString,
  toRequiredObjectIdString,
  toRequiredString
} from '~/services/resource-normalizers';
import { normalizeRelatedTransactionSummary } from '~/services/tasks.api';
import type {
  CreateTransactionNotePayload,
  TransactionNote,
  UpdateTransactionNotePayload
} from '~/types/transaction-note';

const TRANSACTION_NOTES_ENDPOINT = '/transaction-notes';
const TRANSACTION_NOTE_ENDPOINT = (id: string) => `${TRANSACTION_NOTES_ENDPOINT}/${id}`;
const TRANSACTION_NOTES_RECENT_ENDPOINT = `${TRANSACTION_NOTES_ENDPOINT}/recent`;

type ObjectIdLike = string | { toString(): string };

interface ApiTransactionNote {
  _id?: ObjectIdLike;
  id?: ObjectIdLike;
  transactionId?: string | Record<string, unknown>;
  authorId?: string | Record<string, unknown>;
  content?: string;
  deletedBy?: unknown;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const resolveReferenceId = (value: unknown, fieldName: string): string => {
  if (typeof value === 'string') {
    return toRequiredObjectIdString(value, fieldName);
  }

  if (isObject(value)) {
    return toRequiredObjectIdString(value.id ?? value._id, fieldName);
  }

  return toRequiredObjectIdString(value, fieldName);
};

export const normalizeTransactionNote = (
  apiTransactionNote: ApiTransactionNote
): TransactionNote => ({
  id: toRequiredObjectIdString(apiTransactionNote.id ?? apiTransactionNote._id, 'note.id'),
  transactionId: resolveReferenceId(apiTransactionNote.transactionId, 'note.transactionId'),
  authorId: resolveReferenceId(apiTransactionNote.authorId, 'note.authorId'),
  content: toRequiredString(apiTransactionNote.content, 'note.content'),
  transaction:
    isObject(apiTransactionNote.transactionId) && typeof apiTransactionNote.transactionId !== 'string'
      ? normalizeRelatedTransactionSummary(apiTransactionNote.transactionId as never)
      : undefined,
  author: normalizeAgentSummary(apiTransactionNote.authorId as never),
  deletedBy: normalizeAgentSummary(apiTransactionNote.deletedBy as never),
  deletedAt: normalizeOptionalIsoDate(apiTransactionNote.deletedAt, 'note.deletedAt'),
  createdAt: apiTransactionNote.createdAt,
  updatedAt: apiTransactionNote.updatedAt
});

export const useTransactionNotesApi = () => {
  const api = useApi();

  return {
    async listNotes(params: { transactionId?: string; limit?: number } = {}): Promise<TransactionNote[]> {
      const response = await api.request<ApiTransactionNote[]>(TRANSACTION_NOTES_ENDPOINT, {
        headers: createStoredAuthHeaders(),
        query: {
          ...(params.transactionId ? { transactionId: params.transactionId } : {}),
          ...(params.limit ? { limit: params.limit } : {})
        }
      });

      if (!Array.isArray(response)) {
        throw new Error('Invalid API response: expected a transaction note array.');
      }

      return response.map(normalizeTransactionNote);
    },

    async listRecentNotes(limit = 8): Promise<TransactionNote[]> {
      const response = await api.request<ApiTransactionNote[]>(TRANSACTION_NOTES_RECENT_ENDPOINT, {
        headers: createStoredAuthHeaders(),
        query: { limit }
      });

      if (!Array.isArray(response)) {
        throw new Error('Invalid API response: expected a transaction note array.');
      }

      return response.map(normalizeTransactionNote);
    },

    async createNote(payload: CreateTransactionNotePayload): Promise<TransactionNote> {
      const response = await api.request<ApiTransactionNote>(TRANSACTION_NOTES_ENDPOINT, {
        method: 'POST',
        headers: createStoredAuthHeaders(),
        body: payload
      });

      return normalizeTransactionNote(response);
    },

    async updateNote(id: string, payload: UpdateTransactionNotePayload): Promise<TransactionNote> {
      const response = await api.request<ApiTransactionNote>(TRANSACTION_NOTE_ENDPOINT(id), {
        method: 'PATCH',
        headers: createStoredAuthHeaders(),
        body: payload
      });

      return normalizeTransactionNote(response);
    },

    async deleteNote(id: string): Promise<{ success: boolean }> {
      const response = await api.request<{ success?: boolean }>(TRANSACTION_NOTE_ENDPOINT(id), {
        method: 'DELETE',
        headers: createStoredAuthHeaders()
      });

      return { success: Boolean(response.success) };
    }
  };
};
