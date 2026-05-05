<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';

import MetricCard from '~/components/dashboard/MetricCard.vue';
import { useAuthStore } from '~/stores/auth';
import { useClientsStore } from '~/stores/clients';
import { usePropertiesStore } from '~/stores/properties';
import { useTasksStore } from '~/stores/tasks';
import { useTransactionsStore } from '~/stores/transactions';
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  type CreateTaskPayload,
  type Task,
  type TaskDueFilter,
  type TaskPriority,
  type TaskStatus
} from '~/types/task';

const authStore = useAuthStore();
const tasksStore = useTasksStore();
const transactionsStore = useTransactionsStore();
const clientsStore = useClientsStore();
const propertiesStore = usePropertiesStore();

useHead({ title: 'Tasks' });

const selectedTaskId = ref<string | null>(null);
const successMessage = ref('');
const statusFilter = ref<TaskStatus | 'all'>('all');
const priorityFilter = ref<TaskPriority | 'all'>('all');
const assignedToFilter = ref('');
const dueFilter = ref<TaskDueFilter | 'all'>('all');
let filterTimer: ReturnType<typeof setTimeout> | null = null;

const form = reactive({
  title: '',
  description: '',
  dueDate: '',
  status: 'todo' as TaskStatus,
  priority: 'medium' as TaskPriority,
  assignedTo: '',
  relatedTransactionId: '',
  relatedClientId: '',
  relatedPropertyId: ''
});

const selectedTask = computed(
  () => tasksStore.items.find((task) => task.id === selectedTaskId.value) ?? null
);
const isEditing = computed(() => Boolean(selectedTask.value));
const canCreate = computed(() => authStore.canCreateTenantResources);
const canManage = computed(() => authStore.canManageTenantResources);
const currentUserId = computed(() => authStore.currentUser?.id ?? null);
const canSubmit = computed(
  () =>
    canCreate.value &&
    form.title.trim().length >= 2 &&
    !tasksStore.isCreating &&
    !tasksStore.updateTaskId
);

const canEditTask = (task: Task) =>
  canManage.value || (task.assignedToId !== null && task.assignedToId === currentUserId.value);

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(value))
    : 'No due date';

const toDateInputValue = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 16);
};

const getStatusLabel = (status: TaskStatus) =>
  TASK_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

const getPriorityLabel = (priority: TaskPriority) =>
  TASK_PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ?? priority;

const resetForm = () => {
  selectedTaskId.value = null;
  form.title = '';
  form.description = '';
  form.dueDate = '';
  form.status = 'todo';
  form.priority = 'medium';
  form.assignedTo = canManage.value ? '' : currentUserId.value ?? '';
  form.relatedTransactionId = '';
  form.relatedClientId = '';
  form.relatedPropertyId = '';
};

const editTask = (task: Task) => {
  selectedTaskId.value = task.id;
  form.title = task.title;
  form.description = task.description;
  form.dueDate = toDateInputValue(task.dueDate);
  form.status = task.status;
  form.priority = task.priority;
  form.assignedTo = task.assignedToId ?? '';
  form.relatedTransactionId = task.relatedTransactionId ?? '';
  form.relatedClientId = task.relatedClientId ?? '';
  form.relatedPropertyId = task.relatedPropertyId ?? '';
};

const buildPayload = (): CreateTaskPayload => ({
  title: form.title.trim(),
  description: form.description.trim() || undefined,
  dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
  status: form.status,
  priority: form.priority,
  assignedTo: canManage.value ? form.assignedTo || null : currentUserId.value,
  relatedTransactionId: form.relatedTransactionId || null,
  relatedClientId: form.relatedClientId || null,
  relatedPropertyId: form.relatedPropertyId || null
});

const submitForm = async () => {
  if (!canSubmit.value) {
    return;
  }

  try {
    if (selectedTask.value) {
      await tasksStore.updateTask(selectedTask.value.id, buildPayload());
      successMessage.value = 'Task updated.';
    } else {
      await tasksStore.createTask(buildPayload());
      successMessage.value = 'Task created.';
    }
    resetForm();
  } catch {
    // Store error is rendered below.
  }
};

const archiveTask = async (task: Task) => {
  if (!canManage.value || !import.meta.client) {
    return;
  }

  const confirmed = window.confirm(`Archive "${task.title}"? This keeps task history.`);
  if (!confirmed) {
    return;
  }

  try {
    await tasksStore.deleteTask(task.id);
    successMessage.value = 'Task archived.';
    if (selectedTaskId.value === task.id) {
      resetForm();
    }
  } catch {
    // Store error is rendered below.
  }
};

const applyFilters = async () => {
  await tasksStore.fetchTasks({
    force: true,
    query: {
      status: statusFilter.value,
      priority: priorityFilter.value,
      assignedTo: assignedToFilter.value,
      dueFilter: dueFilter.value
    }
  });
};

const scheduleFilterApply = () => {
  if (filterTimer) {
    clearTimeout(filterTimer);
  }

  filterTimer = setTimeout(() => {
    applyFilters().catch(() => undefined);
  }, 250);
};

const clearFilters = async () => {
  statusFilter.value = 'all';
  priorityFilter.value = 'all';
  assignedToFilter.value = '';
  dueFilter.value = 'all';
  await applyFilters();
};

watch([statusFilter, priorityFilter, assignedToFilter, dueFilter], scheduleFilterApply);

onMounted(async () => {
  authStore.hydrateFromStorage();
  resetForm();
  await Promise.all([
    authStore.fetchUsers().catch(() => undefined),
    tasksStore.fetchTasks({ force: true }),
    transactionsStore.fetchTransactions({ force: true }).catch(() => undefined),
    clientsStore.fetchClients({ force: true }).catch(() => undefined),
    propertiesStore.fetchProperties({ force: true }).catch(() => undefined)
  ]);
});
</script>

<template>
  <section class="space-y-6">
    <header class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Operations</p>
          <h1 class="mt-2 text-3xl font-semibold sm:text-4xl">Tasks</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Track follow-ups, assignments, and deal work across transactions, clients, and properties.
          </p>
        </div>
        <button type="button" class="btn-secondary" :disabled="tasksStore.isLoading" @click="tasksStore.refreshTasks()">
          {{ tasksStore.isLoading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </header>

    <div class="grid gap-4 md:grid-cols-4">
      <MetricCard label="Pending Tasks" :value="String(tasksStore.summary.pending)" helper="Todo and in progress" />
      <MetricCard label="Overdue" :value="String(tasksStore.summary.overdue)" helper="Open tasks before today" emphasis />
      <MetricCard label="Due Today" :value="String(tasksStore.summary.dueToday)" helper="Open tasks due today" />
      <MetricCard label="Due This Week" :value="String(tasksStore.summary.dueThisWeek)" helper="Next 7 days" />
    </div>

    <div v-if="tasksStore.error" class="alert-error">{{ tasksStore.error }}</div>
    <div v-if="successMessage" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      {{ successMessage }}
    </div>

    <section class="panel">
      <div class="panel-body grid gap-4 lg:grid-cols-5">
        <label class="block">
          <span class="field-label">Status</span>
          <select v-model="statusFilter" class="input-base">
            <option value="all">All statuses</option>
            <option v-for="option in TASK_STATUS_OPTIONS" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="field-label">Priority</span>
          <select v-model="priorityFilter" class="input-base">
            <option value="all">All priorities</option>
            <option v-for="option in TASK_PRIORITY_OPTIONS" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="field-label">Assigned User</span>
          <select v-model="assignedToFilter" class="input-base">
            <option value="">Anyone</option>
            <option v-for="agent in authStore.activeUsers" :key="agent.id" :value="agent.id">
              {{ agent.name }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="field-label">Due</span>
          <select v-model="dueFilter" class="input-base">
            <option value="all">Any due date</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due today</option>
            <option value="week">Due this week</option>
          </select>
        </label>
        <div class="flex items-end">
          <button type="button" class="btn-secondary w-full" :disabled="tasksStore.isLoading" @click="clearFilters">
            Clear
          </button>
        </div>
      </div>
    </section>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section class="panel">
        <div class="panel-body">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold">Task List</h2>
              <p class="text-sm text-slate-500">{{ tasksStore.count }} records</p>
            </div>
          </div>

          <div v-if="tasksStore.isLoading && tasksStore.items.length === 0" class="space-y-3">
            <div class="skeleton h-20 w-full"></div>
            <div class="skeleton h-20 w-full"></div>
            <div class="skeleton h-20 w-full"></div>
          </div>

          <div v-else-if="tasksStore.items.length === 0" class="empty-state">
            <h3 class="text-lg font-semibold">{{ tasksStore.hasActiveFilters ? 'No tasks match filters' : 'No tasks yet' }}</h3>
            <p class="mt-2 text-sm text-slate-500">
              {{ tasksStore.hasActiveFilters ? 'Try clearing filters to widen the list.' : 'Create a task to start tracking follow-up work.' }}
            </p>
          </div>

          <ul v-else class="divide-y divide-slate-100 dark:divide-slate-800">
            <li v-for="task in tasksStore.items" :key="task.id" class="py-4">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div class="min-w-0 space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-semibold text-slate-900 dark:text-slate-100">{{ task.title }}</p>
                    <span class="status-chip">{{ getStatusLabel(task.status) }}</span>
                    <span class="status-chip">{{ getPriorityLabel(task.priority) }}</span>
                  </div>
                  <p class="text-sm text-slate-500">
                    {{ formatDate(task.dueDate) }} · Assigned to {{ task.assignedTo?.name ?? 'Unassigned' }}
                  </p>
                  <p v-if="task.description" class="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                    {{ task.description }}
                  </p>
                  <p v-if="task.relatedTransaction" class="text-xs text-slate-500">
                    Transaction: {{ task.relatedTransaction.propertyTitle }}
                  </p>
                  <p v-if="task.relatedClient || task.relatedProperty" class="text-xs text-slate-500">
                    <span v-if="task.relatedClient">Client: {{ task.relatedClient.fullName }}</span>
                    <span v-if="task.relatedClient && task.relatedProperty"> · </span>
                    <span v-if="task.relatedProperty">Property: {{ task.relatedProperty.title }}</span>
                  </p>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <button v-if="canEditTask(task)" type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="editTask(task)">
                    Edit
                  </button>
                  <button
                    v-if="canManage"
                    type="button"
                    class="btn-secondary px-3 py-1.5 text-xs"
                    :disabled="tasksStore.deleteTaskId === task.id"
                    @click="archiveTask(task)"
                  >
                    {{ tasksStore.deleteTaskId === task.id ? 'Archiving...' : 'Archive' }}
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <aside class="panel">
        <div class="panel-body">
          <h2 class="text-lg font-semibold">{{ isEditing ? 'Edit Task' : 'Create Task' }}</h2>
          <p v-if="!canCreate" class="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Your role can view tasks, but cannot create or update them.
          </p>

          <form class="mt-5 space-y-4" @submit.prevent="submitForm">
            <label class="block">
              <span class="field-label">Title</span>
              <input v-model="form.title" class="input-base" type="text" :disabled="!canCreate" />
            </label>

            <label class="block">
              <span class="field-label">Description</span>
              <textarea v-model="form.description" class="input-base min-h-24" :disabled="!canCreate"></textarea>
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="field-label">Due Date</span>
                <input v-model="form.dueDate" class="input-base" type="datetime-local" :disabled="!canCreate" />
              </label>
              <label class="block">
                <span class="field-label">Assigned To</span>
                <select v-model="form.assignedTo" class="input-base" :disabled="!canCreate || !canManage">
                  <option value="">Unassigned</option>
                  <option v-for="agent in authStore.activeUsers" :key="agent.id" :value="agent.id">
                    {{ agent.name }}
                  </option>
                </select>
              </label>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="field-label">Status</span>
                <select v-model="form.status" class="input-base" :disabled="!canCreate">
                  <option v-for="option in TASK_STATUS_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <label class="block">
                <span class="field-label">Priority</span>
                <select v-model="form.priority" class="input-base" :disabled="!canCreate">
                  <option v-for="option in TASK_PRIORITY_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>
            </div>

            <label class="block">
              <span class="field-label">Transaction</span>
              <select v-model="form.relatedTransactionId" class="input-base" :disabled="!canCreate">
                <option value="">No transaction</option>
                <option v-for="transaction in transactionsStore.items" :key="transaction.id" :value="transaction.id">
                  {{ transaction.propertyTitle }}
                </option>
              </select>
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="field-label">Client</span>
                <select v-model="form.relatedClientId" class="input-base" :disabled="!canCreate">
                  <option value="">No client</option>
                  <option v-for="client in clientsStore.items" :key="client.id" :value="client.id">
                    {{ client.fullName }}
                  </option>
                </select>
              </label>
              <label class="block">
                <span class="field-label">Property</span>
                <select v-model="form.relatedPropertyId" class="input-base" :disabled="!canCreate">
                  <option value="">No property</option>
                  <option v-for="property in propertiesStore.items" :key="property.id" :value="property.id">
                    {{ property.title }}
                  </option>
                </select>
              </label>
            </div>

            <div class="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button type="button" class="btn-secondary" :disabled="tasksStore.isCreating || Boolean(tasksStore.updateTaskId)" @click="resetForm">
                Clear
              </button>
              <button type="submit" class="btn-primary" :disabled="!canSubmit">
                {{ tasksStore.isCreating || tasksStore.updateTaskId ? 'Saving...' : isEditing ? 'Save Task' : 'Create Task' }}
              </button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  </section>
</template>
