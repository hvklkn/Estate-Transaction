import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { toApiErrorMessage } from '~/services/api.errors';
import { useTasksApi } from '~/services/tasks.api';
import type {
  CreateTaskPayload,
  Task,
  TaskDueFilter,
  TaskListQueryParams,
  TaskPriority,
  TasksSummary,
  TaskStatus,
  UpdateTaskPayload
} from '~/types/task';

export interface TasksQueryState {
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  assignedTo: string;
  dueFilter: TaskDueFilter | 'all';
}

const DEFAULT_QUERY_STATE: TasksQueryState = {
  status: 'all',
  priority: 'all',
  assignedTo: '',
  dueFilter: 'all'
};

const toApiQueryParams = (queryState: TasksQueryState): TaskListQueryParams => ({
  status: queryState.status === 'all' ? undefined : queryState.status,
  priority: queryState.priority === 'all' ? undefined : queryState.priority,
  assignedTo: queryState.assignedTo || undefined,
  dueFilter: queryState.dueFilter === 'all' ? undefined : queryState.dueFilter
});

export const useTasksStore = defineStore('tasks', () => {
  const api = useTasksApi();

  const items = ref<Task[]>([]);
  const relatedTasksByTransactionId = ref<Record<string, Task[]>>({});
  const isLoading = ref(false);
  const isCreating = ref(false);
  const updateTaskId = ref<string | null>(null);
  const deleteTaskId = ref<string | null>(null);
  const error = ref<string | null>(null);
  const hasLoaded = ref(false);
  const queryState = ref<TasksQueryState>({ ...DEFAULT_QUERY_STATE });
  const summary = ref<TasksSummary>({
    pending: 0,
    overdue: 0,
    dueToday: 0,
    dueThisWeek: 0
  });

  const count = computed(() => items.value.length);
  const hasActiveFilters = computed(
    () =>
      queryState.value.status !== 'all' ||
      queryState.value.priority !== 'all' ||
      Boolean(queryState.value.assignedTo) ||
      queryState.value.dueFilter !== 'all'
  );

  const setError = (message: string | null) => {
    error.value = message;
  };

  const fetchTasks = async (
    options: { force?: boolean; query?: Partial<TasksQueryState> } = {}
  ) => {
    if (isLoading.value) {
      return;
    }

    if (hasLoaded.value && !options.force && !options.query) {
      return;
    }

    const nextQueryState = {
      ...queryState.value,
      ...options.query
    };

    isLoading.value = true;
    setError(null);

    try {
      const [taskItems, nextSummary] = await Promise.all([
        api.listTasks(toApiQueryParams(nextQueryState)),
        api.getTasksSummary().catch(() => summary.value)
      ]);
      items.value = taskItems;
      summary.value = nextSummary;
      queryState.value = nextQueryState;
      hasLoaded.value = true;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
    } finally {
      isLoading.value = false;
    }
  };

  const refreshTasks = async () => {
    await fetchTasks({ force: true });
  };

  const fetchSummary = async () => {
    try {
      summary.value = await api.getTasksSummary();
    } catch {
      // Summary is supplementary; page-level fetches keep the main error state.
    }
  };

  const fetchRelatedTasksForTransaction = async (transactionId: string) => {
    try {
      relatedTasksByTransactionId.value = {
        ...relatedTasksByTransactionId.value,
        [transactionId]: await api.listTasks({ relatedTransactionId: transactionId })
      };
    } catch {
      relatedTasksByTransactionId.value = {
        ...relatedTasksByTransactionId.value,
        [transactionId]: []
      };
    }
  };

  const createTask = async (payload: CreateTaskPayload) => {
    isCreating.value = true;
    setError(null);

    try {
      const task = await api.createTask(payload);
      await refreshTasks();
      await fetchSummary();
      if (task.relatedTransactionId) {
        await fetchRelatedTasksForTransaction(task.relatedTransactionId);
      }
      return task;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      isCreating.value = false;
    }
  };

  const updateTask = async (id: string, payload: UpdateTaskPayload) => {
    updateTaskId.value = id;
    setError(null);

    try {
      const task = await api.updateTask(id, payload);
      await refreshTasks();
      await fetchSummary();
      if (task.relatedTransactionId) {
        await fetchRelatedTasksForTransaction(task.relatedTransactionId);
      }
      return task;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      updateTaskId.value = null;
    }
  };

  const deleteTask = async (id: string) => {
    deleteTaskId.value = id;
    setError(null);

    try {
      const result = await api.deleteTask(id);
      await refreshTasks();
      await fetchSummary();
      return result;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      deleteTaskId.value = null;
    }
  };

  return {
    items,
    relatedTasksByTransactionId,
    isLoading,
    isCreating,
    updateTaskId,
    deleteTaskId,
    error,
    hasLoaded,
    queryState,
    summary,
    count,
    hasActiveFilters,
    fetchTasks,
    refreshTasks,
    fetchSummary,
    fetchRelatedTasksForTransaction,
    createTask,
    updateTask,
    deleteTask,
    setError
  };
});
