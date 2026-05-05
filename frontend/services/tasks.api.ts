import { normalizeClientSummary } from '~/services/clients.api';
import { normalizePropertySummary } from '~/services/properties.api';
import {
  createStoredAuthHeaders,
  isObject,
  normalizeAgentSummary,
  normalizeOptionalIsoDate,
  toOptionalObjectIdString,
  toOptionalString,
  toRequiredObjectIdString,
  toRequiredString
} from '~/services/resource-normalizers';
import type {
  CreateTaskPayload,
  RelatedTransactionSummary,
  Task,
  TaskDueFilter,
  TaskListQueryParams,
  TaskPriority,
  TasksSummary,
  TaskStatus,
  UpdateTaskPayload
} from '~/types/task';

const TASKS_ENDPOINT = '/tasks';
const TASK_ENDPOINT = (id: string) => `${TASKS_ENDPOINT}/${id}`;
const TASKS_SUMMARY_ENDPOINT = `${TASKS_ENDPOINT}/summary`;
const TASK_STATUSES = new Set<TaskStatus>(['todo', 'in_progress', 'done', 'cancelled']);
const TASK_PRIORITIES = new Set<TaskPriority>(['low', 'medium', 'high', 'urgent']);

type ObjectIdLike = string | { toString(): string };

interface ApiRelatedTransaction {
  _id?: ObjectIdLike;
  id?: ObjectIdLike;
  propertyTitle?: string;
  stage?: string;
  transactionType?: string;
}

interface ApiTask {
  _id?: ObjectIdLike;
  id?: ObjectIdLike;
  title?: string;
  description?: string;
  dueDate?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string | Record<string, unknown> | null;
  relatedTransactionId?: string | ApiRelatedTransaction | null;
  relatedClientId?: string | Record<string, unknown> | null;
  relatedPropertyId?: string | Record<string, unknown> | null;
  createdBy?: unknown;
  updatedBy?: unknown;
  deletedBy?: unknown;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const normalizeTaskStatus = (value: unknown): TaskStatus =>
  typeof value === 'string' && TASK_STATUSES.has(value as TaskStatus)
    ? (value as TaskStatus)
    : 'todo';

const normalizeTaskPriority = (value: unknown): TaskPriority =>
  typeof value === 'string' && TASK_PRIORITIES.has(value as TaskPriority)
    ? (value as TaskPriority)
    : 'medium';

export const normalizeRelatedTransactionSummary = (
  apiTransaction: ApiRelatedTransaction
): RelatedTransactionSummary => ({
  id: toRequiredObjectIdString(apiTransaction.id ?? apiTransaction._id, 'transaction.id'),
  propertyTitle: toRequiredString(apiTransaction.propertyTitle, 'transaction.propertyTitle'),
  stage: toOptionalString(apiTransaction.stage),
  transactionType: toOptionalString(apiTransaction.transactionType)
});

const resolveReferenceId = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return toOptionalObjectIdString(value);
  }

  if (isObject(value)) {
    return toOptionalObjectIdString(value.id ?? value._id);
  }

  return null;
};

export const normalizeTask = (apiTask: ApiTask): Task => {
  const relatedTransaction =
    isObject(apiTask.relatedTransactionId) && typeof apiTask.relatedTransactionId !== 'string'
      ? normalizeRelatedTransactionSummary(apiTask.relatedTransactionId as ApiRelatedTransaction)
      : undefined;
  const relatedClient =
    isObject(apiTask.relatedClientId) && typeof apiTask.relatedClientId !== 'string'
      ? normalizeClientSummary(apiTask.relatedClientId as never)
      : undefined;
  const relatedProperty =
    isObject(apiTask.relatedPropertyId) && typeof apiTask.relatedPropertyId !== 'string'
      ? normalizePropertySummary(apiTask.relatedPropertyId as never)
      : undefined;

  return {
    id: toRequiredObjectIdString(apiTask.id ?? apiTask._id, 'task.id'),
    title: toRequiredString(apiTask.title, 'task.title'),
    description: toOptionalString(apiTask.description),
    dueDate: normalizeOptionalIsoDate(apiTask.dueDate, 'task.dueDate'),
    status: normalizeTaskStatus(apiTask.status),
    priority: normalizeTaskPriority(apiTask.priority),
    assignedToId: resolveReferenceId(apiTask.assignedTo),
    relatedTransactionId: resolveReferenceId(apiTask.relatedTransactionId),
    relatedClientId: resolveReferenceId(apiTask.relatedClientId),
    relatedPropertyId: resolveReferenceId(apiTask.relatedPropertyId),
    assignedTo: normalizeAgentSummary(apiTask.assignedTo as never),
    relatedTransaction,
    relatedClient,
    relatedProperty,
    createdBy: normalizeAgentSummary(apiTask.createdBy as never),
    updatedBy: normalizeAgentSummary(apiTask.updatedBy as never),
    deletedBy: normalizeAgentSummary(apiTask.deletedBy as never),
    deletedAt: normalizeOptionalIsoDate(apiTask.deletedAt, 'task.deletedAt'),
    createdAt: apiTask.createdAt,
    updatedAt: apiTask.updatedAt
  };
};

const normalizeListQueryParams = (
  params: TaskListQueryParams
): Record<string, string | number> => {
  const query: Record<string, string | number> = {};

  if (params.status) {
    query.status = params.status;
  }

  if (params.priority) {
    query.priority = params.priority;
  }

  if (params.assignedTo) {
    query.assignedTo = params.assignedTo;
  }

  if (params.relatedTransactionId) {
    query.relatedTransactionId = params.relatedTransactionId;
  }

  if (params.dueFilter) {
    query.dueFilter = params.dueFilter;
  }

  return query;
};

const toSummaryCount = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;

export const useTasksApi = () => {
  const api = useApi();

  return {
    async listTasks(params: TaskListQueryParams = {}): Promise<Task[]> {
      const response = await api.request<ApiTask[]>(TASKS_ENDPOINT, {
        headers: createStoredAuthHeaders(),
        query: normalizeListQueryParams(params)
      });

      if (!Array.isArray(response)) {
        throw new Error('Invalid API response: expected a task array.');
      }

      return response.map(normalizeTask);
    },

    async getTasksSummary(): Promise<TasksSummary> {
      const response = await api.request<Partial<TasksSummary>>(TASKS_SUMMARY_ENDPOINT, {
        headers: createStoredAuthHeaders()
      });

      return {
        pending: toSummaryCount(response.pending),
        overdue: toSummaryCount(response.overdue),
        dueToday: toSummaryCount(response.dueToday),
        dueThisWeek: toSummaryCount(response.dueThisWeek)
      };
    },

    async createTask(payload: CreateTaskPayload): Promise<Task> {
      const response = await api.request<ApiTask>(TASKS_ENDPOINT, {
        method: 'POST',
        headers: createStoredAuthHeaders(),
        body: payload
      });

      return normalizeTask(response);
    },

    async updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
      const response = await api.request<ApiTask>(TASK_ENDPOINT(id), {
        method: 'PATCH',
        headers: createStoredAuthHeaders(),
        body: payload
      });

      return normalizeTask(response);
    },

    async deleteTask(id: string): Promise<{ success: boolean }> {
      const response = await api.request<{ success?: boolean }>(TASK_ENDPOINT(id), {
        method: 'DELETE',
        headers: createStoredAuthHeaders()
      });

      return { success: Boolean(response.success) };
    }
  };
};
