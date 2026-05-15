<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';

import MetricCard from '~/components/dashboard/MetricCard.vue';
import { useAppI18n } from '~/composables/useAppI18n';
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
const { t, formatDateTime } = useAppI18n();

useHead(() => ({ title: t('tasksPage.meta.title') }));

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
  value ? formatDateTime(value) : t('tasksPage.list.noDueDate');

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
  t(`tasks.statuses.${status}`);

const getPriorityLabel = (priority: TaskPriority) =>
  t(`tasks.priorities.${priority}`);

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
      successMessage.value = t('tasksPage.messages.updated');
    } else {
      await tasksStore.createTask(buildPayload());
      successMessage.value = t('tasksPage.messages.created');
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

  const confirmed = window.confirm(t('tasksPage.messages.archiveConfirm', { title: task.title }));
  if (!confirmed) {
    return;
  }

  try {
    await tasksStore.deleteTask(task.id);
    successMessage.value = t('tasksPage.messages.archived');
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

const taskStatusOptions = computed(() =>
  TASK_STATUS_OPTIONS.map((option) => ({
    value: option.value,
    label: t(`tasks.statuses.${option.value}`)
  }))
);
const taskPriorityOptions = computed(() =>
  TASK_PRIORITY_OPTIONS.map((option) => ({
    value: option.value,
    label: t(`tasks.priorities.${option.value}`)
  }))
);
</script>

<template>
  <section class="space-y-6">
    <AppPageHeader
      :eyebrow="t('tasksPage.header.kicker')"
      :title="t('tasksPage.header.title')"
      :description="t('tasksPage.header.description')"
      :meta="t('tasksPage.header.meta', { count: tasksStore.count })"
    >
      <template #actions>
        <button type="button" class="btn-secondary" :disabled="tasksStore.isLoading" @click="tasksStore.refreshTasks()">
          {{ tasksStore.isLoading ? t('common.loading') : t('common.refresh') }}
        </button>
      </template>
    </AppPageHeader>

    <div class="grid gap-4 md:grid-cols-4">
      <MetricCard :label="t('tasksPage.metrics.pendingTasks')" :value="String(tasksStore.summary.pending)" :helper="t('tasksPage.metrics.pendingHelper')" />
      <MetricCard :label="t('tasksPage.metrics.overdue')" :value="String(tasksStore.summary.overdue)" :helper="t('tasksPage.metrics.overdueHelper')" emphasis />
      <MetricCard :label="t('tasksPage.metrics.dueToday')" :value="String(tasksStore.summary.dueToday)" :helper="t('tasksPage.metrics.dueTodayHelper')" />
      <MetricCard :label="t('tasksPage.metrics.dueThisWeek')" :value="String(tasksStore.summary.dueThisWeek)" :helper="t('tasksPage.metrics.dueThisWeekHelper')" />
    </div>

    <div v-if="tasksStore.error" class="alert-error">{{ tasksStore.error }}</div>
    <div v-if="successMessage" class="alert-success">
      {{ successMessage }}
    </div>

    <section class="panel">
      <div class="panel-body space-y-4">
        <AppSectionHeader :title="t('tasksPage.controls.title')" :description="t('tasksPage.controls.description')" />
        <div class="grid gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40 lg:grid-cols-5">
        <label class="block">
          <span class="field-label">{{ t('common.status') }}</span>
          <select v-model="statusFilter" class="input-base">
            <option value="all">{{ t('tasksPage.controls.allStatuses') }}</option>
            <option v-for="option in taskStatusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="field-label">{{ t('tasksPage.form.priority') }}</span>
          <select v-model="priorityFilter" class="input-base">
            <option value="all">{{ t('tasksPage.controls.allPriorities') }}</option>
            <option v-for="option in taskPriorityOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="field-label">{{ t('tasksPage.controls.assignedUser') }}</span>
          <select v-model="assignedToFilter" class="input-base">
            <option value="">{{ t('tasksPage.controls.anyone') }}</option>
            <option v-for="agent in authStore.activeUsers" :key="agent.id" :value="agent.id">
              {{ agent.name }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="field-label">{{ t('tasksPage.controls.due') }}</span>
          <select v-model="dueFilter" class="input-base">
            <option value="all">{{ t('tasksPage.controls.anyDueDate') }}</option>
            <option value="overdue">{{ t('tasks.dueFilters.overdue') }}</option>
            <option value="today">{{ t('tasks.dueFilters.today') }}</option>
            <option value="week">{{ t('tasks.dueFilters.week') }}</option>
          </select>
        </label>
        <div class="flex items-end">
          <button type="button" class="btn-secondary w-full" :disabled="tasksStore.isLoading" @click="clearFilters">
            {{ t('common.clear') }}
          </button>
        </div>
        </div>
      </div>
    </section>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section class="panel">
        <div class="panel-body">
          <AppSectionHeader :title="t('tasksPage.list.title')" :description="t('tasksPage.list.description', { count: tasksStore.count })" />

          <div v-if="tasksStore.isLoading && tasksStore.items.length === 0" class="space-y-3">
            <div class="skeleton h-20 w-full"></div>
            <div class="skeleton h-20 w-full"></div>
            <div class="skeleton h-20 w-full"></div>
          </div>

          <AppEmptyState
            v-else-if="tasksStore.items.length === 0"
            :title="tasksStore.hasActiveFilters ? t('tasksPage.list.emptyFilteredTitle') : t('tasksPage.list.emptyTitle')"
            :description="tasksStore.hasActiveFilters ? t('tasksPage.list.emptyFilteredDescription') : t('tasksPage.list.emptyDescription')"
          />

          <ul v-else class="record-list mt-5">
            <li v-for="task in tasksStore.items" :key="task.id" class="record-row px-1">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div class="min-w-0 space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-semibold text-slate-950 dark:text-white">{{ task.title }}</p>
                    <span class="status-chip">{{ getStatusLabel(task.status) }}</span>
                    <span class="status-chip">{{ getPriorityLabel(task.priority) }}</span>
                  </div>
                  <p class="text-sm text-slate-500">
                    {{ formatDate(task.dueDate) }} · {{ t('tasksPage.list.assignedTo') }} {{ task.assignedTo?.name ?? t('tasksPage.list.unassigned') }}
                  </p>
                  <p v-if="task.description" class="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                    {{ task.description }}
                  </p>
                  <p v-if="task.relatedTransaction" class="text-xs text-slate-500">
                    {{ t('tasksPage.list.transaction') }}: {{ task.relatedTransaction.propertyTitle }}
                  </p>
                  <p v-if="task.relatedClient || task.relatedProperty" class="text-xs text-slate-500">
                    <span v-if="task.relatedClient">{{ t('tasksPage.list.client') }}: {{ task.relatedClient.fullName }}</span>
                    <span v-if="task.relatedClient && task.relatedProperty"> · </span>
                    <span v-if="task.relatedProperty">{{ t('tasksPage.list.property') }}: {{ task.relatedProperty.title }}</span>
                  </p>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <button v-if="canEditTask(task)" type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="editTask(task)">
                    {{ t('common.edit') }}
                  </button>
                  <button
                    v-if="canManage"
                    type="button"
                    class="btn-secondary px-3 py-1.5 text-xs"
                    :disabled="tasksStore.deleteTaskId === task.id"
                    @click="archiveTask(task)"
                  >
                    {{ tasksStore.deleteTaskId === task.id ? t('common.archiving') : t('common.archive') }}
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <aside class="panel xl:sticky xl:top-24 xl:self-start">
        <div class="panel-body">
          <AppSectionHeader
            :title="isEditing ? t('tasksPage.form.editTitle') : t('tasksPage.form.createTitle')"
            :description="t('tasksPage.form.description')"
          />
          <p v-if="!canCreate" class="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {{ t('tasksPage.form.cannotCreate') }}
          </p>

          <form class="mt-5 space-y-4" @submit.prevent="submitForm">
            <label class="block">
              <span class="field-label">{{ t('tasksPage.form.title') }}</span>
              <input v-model="form.title" class="input-base" type="text" :disabled="!canCreate" />
            </label>

            <label class="block">
              <span class="field-label">{{ t('tasksPage.form.descriptionLabel') }}</span>
              <textarea v-model="form.description" class="input-base min-h-24" :disabled="!canCreate"></textarea>
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="field-label">{{ t('tasksPage.form.dueDate') }}</span>
                <input v-model="form.dueDate" class="input-base" type="datetime-local" :disabled="!canCreate" />
              </label>
              <label class="block">
                <span class="field-label">{{ t('tasksPage.form.assignedTo') }}</span>
                <select v-model="form.assignedTo" class="input-base" :disabled="!canCreate || !canManage">
                  <option value="">{{ t('tasksPage.list.unassigned') }}</option>
                  <option v-for="agent in authStore.activeUsers" :key="agent.id" :value="agent.id">
                    {{ agent.name }}
                  </option>
                </select>
              </label>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="field-label">{{ t('tasksPage.form.status') }}</span>
                <select v-model="form.status" class="input-base" :disabled="!canCreate">
                  <option v-for="option in taskStatusOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <label class="block">
                <span class="field-label">{{ t('tasksPage.form.priority') }}</span>
                <select v-model="form.priority" class="input-base" :disabled="!canCreate">
                  <option v-for="option in taskPriorityOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>
            </div>

            <label class="block">
              <span class="field-label">{{ t('tasksPage.form.transaction') }}</span>
              <select v-model="form.relatedTransactionId" class="input-base" :disabled="!canCreate">
                <option value="">{{ t('tasksPage.form.noTransaction') }}</option>
                <option v-for="transaction in transactionsStore.items" :key="transaction.id" :value="transaction.id">
                  {{ transaction.propertyTitle }}
                </option>
              </select>
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="field-label">{{ t('tasksPage.form.client') }}</span>
                <select v-model="form.relatedClientId" class="input-base" :disabled="!canCreate">
                  <option value="">{{ t('tasksPage.form.noClient') }}</option>
                  <option v-for="client in clientsStore.items" :key="client.id" :value="client.id">
                    {{ client.fullName }}
                  </option>
                </select>
              </label>
              <label class="block">
                <span class="field-label">{{ t('tasksPage.form.property') }}</span>
                <select v-model="form.relatedPropertyId" class="input-base" :disabled="!canCreate">
                  <option value="">{{ t('tasksPage.form.noProperty') }}</option>
                  <option v-for="property in propertiesStore.items" :key="property.id" :value="property.id">
                    {{ property.title }}
                  </option>
                </select>
              </label>
            </div>

            <div class="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button type="button" class="btn-secondary" :disabled="tasksStore.isCreating || Boolean(tasksStore.updateTaskId)" @click="resetForm">
                {{ t('common.clear') }}
              </button>
              <button type="submit" class="btn-primary" :disabled="!canSubmit">
                {{ tasksStore.isCreating || tasksStore.updateTaskId ? t('common.saving') : isEditing ? t('tasksPage.form.saveTask') : t('tasksPage.form.createTask') }}
              </button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  </section>
</template>
