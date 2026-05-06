<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import MetricCard from '~/components/dashboard/MetricCard.vue';
import TransactionListControls, {
  type TransactionSortOption
} from '~/components/dashboard/TransactionListControls.vue';
import TransactionEditModal from '~/components/transactions/TransactionEditModal.vue';
import TransactionList from '~/components/transactions/TransactionList.vue';
import { useAppI18n } from '~/composables/useAppI18n';
import { useUserSettings } from '~/composables/useUserSettings';
import { useAuthStore } from '~/stores/auth';
import { useBalanceStore } from '~/stores/balance';
import { useClientsStore } from '~/stores/clients';
import { usePropertiesStore } from '~/stores/properties';
import { useReportsStore } from '~/stores/reports';
import { useTasksStore } from '~/stores/tasks';
import { useTransactionNotesStore } from '~/stores/transaction-notes';
import { useTransactionsStore } from '~/stores/transactions';
import {
  TransactionStage,
  TransactionType,
  type TransactionSortBy,
  type TransactionSortOrder,
  type UpdateTransactionPayload
} from '~/types/transaction';

const transactionsStore = useTransactionsStore();
const authStore = useAuthStore();
const balanceStore = useBalanceStore();
const clientsStore = useClientsStore();
const propertiesStore = usePropertiesStore();
const reportsStore = useReportsStore();
const tasksStore = useTasksStore();
const transactionNotesStore = useTransactionNotesStore();
const route = useRoute();
const { t, formatCurrency, formatDateTime, getStageLabel } = useAppI18n();
const { settings, hydrateFromStorage } = useUserSettings();

useHead(() => ({
  title: t('transactions.meta.title')
}));

const searchQuery = ref('');
const stageFilter = ref<TransactionStage | 'all'>('all');
const transactionTypeFilter = ref<TransactionType | 'all'>('all');
const sortBy = ref<TransactionSortOption>('newest');
const includeDeleted = ref(false);
const hasInitializedFilters = ref(false);
const selectedEditTransactionId = ref<string | null>(null);
const isEditModalOpen = ref(false);
const actionSuccessMessage = ref('');
let queryChangeTimer: ReturnType<typeof setTimeout> | null = null;

const hasTransactions = computed(() => transactionsStore.items.length > 0);
const isInitialLoading = computed(() => transactionsStore.isLoading && !hasTransactions.value);
const isRefreshing = computed(() => transactionsStore.isLoading && hasTransactions.value);
const canUseBrowserNotifications = computed(
  () => import.meta.client && typeof window !== 'undefined' && 'Notification' in window
);
const isCompactCardsEnabled = computed(() => settings.value.compactCards);
const isPushNotificationsEnabled = computed(() => settings.value.pushNotifications);
const isEmailSummariesEnabled = computed(() => settings.value.emailSummaries);
const currentPage = computed(() => transactionsStore.pagination.page);
const totalPages = computed(() => transactionsStore.pagination.totalPages);
const totalTransactions = computed(() => transactionsStore.pagination.total);
const canIncludeDeleted = computed(() => {
  const role = authStore.currentUser?.role;
  return (
    role === 'super_admin' ||
    role === 'office_owner' ||
    role === 'admin' ||
    role === 'manager'
  );
});
const canViewDeletedMetadata = computed(
  () => canIncludeDeleted.value || includeDeleted.value
);
const selectedEditTransaction = computed(() =>
  transactionsStore.items.find((transaction) => transaction.id === selectedEditTransactionId.value) ?? null
);
const balanceSummary = computed(() => balanceStore.summary);
const recentBalanceMovements = computed(
  () => balanceSummary.value?.recentLedgerEntries.slice(0, 4) ?? []
);
const reportsSummary = computed(() => reportsStore.summary);
const maxDashboardStageCount = computed(() =>
  Math.max(1, ...reportsSummary.value.transactionCountsByStage.map((item) => item.count))
);
const dashboardTopAgents = computed(() => reportsSummary.value.agentPerformance.slice(0, 4));
const formatReportStageLabel = (stage: string): string => getStageLabel(stage as TransactionStage);
const showingRange = computed(() => {
  if (totalTransactions.value === 0) {
    return '0-0';
  }

  const first = (currentPage.value - 1) * transactionsStore.pagination.limit + 1;
  const last = Math.min(
    currentPage.value * transactionsStore.pagination.limit,
    totalTransactions.value
  );

  return `${first}-${last}`;
});
const emptyStateTitle = computed(() =>
  transactionsStore.hasActiveFilters ? 'No transactions match current filters' : t('transactions.list.emptyTitle')
);
const emptyStateDescription = computed(() =>
  transactionsStore.hasActiveFilters
    ? 'Try clearing search, stage, or transaction type filters to widen the result set.'
    : t('transactions.list.emptyDescription')
);
const summaryEmailHref = computed(() => {
  const recipient = authStore.currentUser?.email ?? '';
  const subject = t('transactions.actions.summaryEmailSubject');
  const bodyLines = [
    t('transactions.actions.summaryEmailIntro'),
    `- ${t('transactions.metrics.totalTransactions.label')}: ${totalTransactions.value}`,
    `- ${t('transactions.metrics.openTransactions.label')}: ${transactionsStore.openTransactionsCount}`,
    `- ${t('transactions.metrics.completedTransactions.label')}: ${transactionsStore.completedTransactionsCount}`,
    `- ${t('transactions.metrics.totalCommissionVolume.label')}: ${formatCurrency(transactionsStore.commissionPipelineAmount)}`
  ];
  const body = bodyLines.join('\n');

  return `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

const getLedgerMovementLabel = (type: 'commission_credit' | 'manual_adjustment' | 'reversal') => {
  switch (type) {
    case 'commission_credit':
      return 'Commission credit';
    case 'manual_adjustment':
      return 'Manual adjustment';
    case 'reversal':
      return 'Reversal';
    default:
      return type;
  }
};

const resolveSortQuery = (
  option: TransactionSortOption
): { sortBy: TransactionSortBy; sortOrder: TransactionSortOrder } => {
  switch (option) {
    case 'oldest':
      return { sortBy: 'createdAt', sortOrder: 'asc' };
    case 'recently_updated':
      return { sortBy: 'updatedAt', sortOrder: 'desc' };
    case 'highest_fee':
      return { sortBy: 'totalServiceFee', sortOrder: 'desc' };
    case 'lowest_fee':
      return { sortBy: 'totalServiceFee', sortOrder: 'asc' };
    case 'property_a_to_z':
      return { sortBy: 'propertyTitle', sortOrder: 'asc' };
    case 'newest':
    default:
      return { sortBy: 'createdAt', sortOrder: 'desc' };
  }
};

const applyQuery = async (page = 1) => {
  const { sortBy: backendSortBy, sortOrder } = resolveSortQuery(sortBy.value);

  await transactionsStore.fetchTransactions({
    force: true,
    query: {
      page,
      search: searchQuery.value,
      stage: stageFilter.value === 'all' ? null : stageFilter.value,
      transactionType: transactionTypeFilter.value === 'all' ? null : transactionTypeFilter.value,
      sortBy: backendSortBy,
      sortOrder,
      includeDeleted: includeDeleted.value
    }
  });
};

const scheduleFilterApply = () => {
  if (!hasInitializedFilters.value) {
    return;
  }

  if (queryChangeTimer) {
    clearTimeout(queryChangeTimer);
  }

  queryChangeTimer = setTimeout(() => {
    applyQuery(1).catch(() => undefined);
  }, 300);
};

const clearFilters = async () => {
  searchQuery.value = '';
  stageFilter.value = 'all';
  transactionTypeFilter.value = 'all';
  sortBy.value = 'newest';
  includeDeleted.value = false;
  await applyQuery(1);
};

const notifyIfEnabled = async (title: string, body: string) => {
  if (!isPushNotificationsEnabled.value || !canUseBrowserNotifications.value) {
    return;
  }

  if (Notification.permission === 'denied') {
    return;
  }

  if (Notification.permission === 'default') {
    const nextPermission = await Notification.requestPermission();
    if (nextPermission !== 'granted') {
      return;
    }
  }

  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
};

const handleStageChange = async (payload: { id: string; stage: TransactionStage }) => {
  try {
    const transaction = await transactionsStore.updateTransactionStage(payload.id, payload.stage);
    await notifyIfEnabled(
      t('transactions.notifications.stageChangedTitle'),
      t('transactions.notifications.stageChangedBody', {
        propertyTitle: transaction.propertyTitle,
        stage: getStageLabel(transaction.stage)
      })
    );
  } catch {
    // Errors are stored in Pinia state and rendered by the page.
  }
};

const handleRefresh = async () => {
  await transactionsStore.refreshTransactions();
};

const handleEditClick = (id: string) => {
  selectedEditTransactionId.value = id;
  isEditModalOpen.value = true;
};

const handleEditClose = () => {
  isEditModalOpen.value = false;
  selectedEditTransactionId.value = null;
};

const handleEditSubmit = async (payload: { id: string; data: UpdateTransactionPayload }) => {
  try {
    await transactionsStore.updateTransaction(payload.id, payload.data);
    actionSuccessMessage.value = 'Transaction updated successfully.';
    handleEditClose();
  } catch {
    // Error is managed by store state.
  }
};

const handleDeleteClick = async (id: string) => {
  if (!import.meta.client) {
    return;
  }

  const confirmed = window.confirm(
    'Are you sure you want to delete this transaction? This will perform a soft delete and keep audit history.'
  );

  if (!confirmed) {
    return;
  }

  try {
    await transactionsStore.deleteTransaction(id);
    actionSuccessMessage.value = 'Transaction deleted successfully.';
  } catch {
    // Error is managed by store state.
  }
};

const goToPreviousPage = async () => {
  if (currentPage.value <= 1) {
    return;
  }

  await applyQuery(currentPage.value - 1);
};

const goToNextPage = async () => {
  if (currentPage.value >= totalPages.value) {
    return;
  }

  await applyQuery(currentPage.value + 1);
};

watch(searchQuery, scheduleFilterApply);
watch(stageFilter, scheduleFilterApply);
watch(transactionTypeFilter, scheduleFilterApply);
watch(sortBy, scheduleFilterApply);
watch(includeDeleted, scheduleFilterApply);

onMounted(async () => {
  authStore.hydrateFromStorage();
  hydrateFromStorage();
  const initialSearch = typeof route.query.search === 'string' ? route.query.search.trim() : '';
  if (initialSearch) {
    searchQuery.value = initialSearch;
  }

  await Promise.all([
    applyQuery(1),
    balanceStore.fetchSummary().catch(() => undefined),
    authStore.fetchUsers().catch(() => undefined),
    clientsStore.fetchClients({ force: true }).catch(() => undefined),
    propertiesStore.fetchProperties({ force: true }).catch(() => undefined),
    reportsStore.fetchSummary().catch(() => undefined),
    tasksStore.fetchSummary().catch(() => undefined),
    transactionNotesStore.fetchRecentNotes().catch(() => undefined)
  ]);
  hasInitializedFilters.value = true;
});

onUnmounted(() => {
  if (queryChangeTimer) {
    clearTimeout(queryChangeTimer);
  }
});
</script>

<template>
  <section class="space-y-8">
    <AppPageHeader
      :eyebrow="t('transactions.header.kicker')"
      :title="t('transactions.header.title')"
      :description="t('transactions.header.description')"
      :meta="`Showing ${showingRange} of ${totalTransactions} records`"
    >
      <template #actions>
        <div class="flex flex-wrap items-center gap-2">
          <span class="status-chip">
            {{ t('transactions.list.recordCount', { count: totalTransactions }) }}
          </span>
          <NuxtLink to="/transactions/create" class="btn-primary">
            {{ t('transactions.actions.create') }}
          </NuxtLink>
          <a
            v-if="isEmailSummariesEnabled"
            :href="summaryEmailHref"
            class="btn-secondary"
          >
            {{ t('transactions.actions.sendSummaryEmail') }}
          </a>
          <button
            type="button"
            class="btn-secondary"
            :disabled="transactionsStore.isLoading"
            @click="handleRefresh"
          >
            {{ isRefreshing ? t('transactions.actions.refreshing') : t('transactions.actions.refresh') }}
          </button>
        </div>
      </template>
    </AppPageHeader>

    <div class="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <MetricCard
        :label="t('transactions.metrics.totalTransactions.label')"
        :value="String(totalTransactions)"
        :helper="'Server-side paginated count'"
      />
      <MetricCard
        :label="t('transactions.metrics.completedTransactions.label')"
        :value="String(transactionsStore.completedTransactionsCount)"
        :helper="'Completed in current page'"
      />
      <MetricCard
        :label="t('transactions.metrics.openTransactions.label')"
        :value="String(transactionsStore.openTransactionsCount)"
        :helper="'Open in current page'"
      />
      <MetricCard
        :label="t('transactions.metrics.totalCommissionVolume.label')"
        :value="formatCurrency(transactionsStore.commissionPipelineAmount)"
        :helper="t('transactions.metrics.totalCommissionVolume.helper')"
        emphasis
      />
      <MetricCard
        :label="t('transactions.metrics.completedAgencyEarnings.label')"
        :value="formatCurrency(transactionsStore.completedEarningsSummary.totalAgencyEarnings)"
        :helper="t('transactions.metrics.completedAgencyEarnings.helper')"
      />
      <MetricCard
        :label="t('transactions.metrics.completedAgentEarnings.label')"
        :value="formatCurrency(transactionsStore.completedEarningsSummary.totalAgentEarnings)"
        :helper="t('transactions.metrics.completedAgentEarnings.helper')"
      />
    </div>

    <section class="grid gap-4 xl:grid-cols-3">
      <article class="panel">
        <div class="panel-body space-y-4">
          <AppSectionHeader title="Stage Mix" description="Lifecycle distribution for the current dashboard scope.">
            <template #actions>
              <NuxtLink to="/reports" class="btn-secondary">Reports</NuxtLink>
            </template>
          </AppSectionHeader>
          <div class="space-y-3">
            <div v-for="item in reportsSummary.transactionCountsByStage" :key="item.key" class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-slate-600 dark:text-slate-300">{{ formatReportStageLabel(item.key) }}</span>
                <span class="text-slate-500">{{ item.count }}</span>
              </div>
              <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <div class="h-2 rounded-full bg-brand-600" :style="{ width: `${Math.max(8, (item.count / maxDashboardStageCount) * 100)}%` }" />
              </div>
            </div>
            <p v-if="reportsSummary.transactionCountsByStage.length === 0" class="text-xs text-slate-500">
              No stage data yet.
            </p>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-body space-y-4">
          <AppSectionHeader title="Monthly Service Fee" description="Revenue signal from completed and active workflows.">
            <template #actions>
              <NuxtLink to="/reports" class="btn-secondary">Analyze</NuxtLink>
            </template>
          </AppSectionHeader>
          <p class="text-3xl font-semibold text-slate-950 dark:text-white">
            {{ formatCurrency(reportsSummary.monthlyServiceFee) }}
          </p>
          <div class="grid gap-2 text-xs sm:grid-cols-2">
            <span class="status-chip">Agency: {{ formatCurrency(reportsSummary.commissionSummary.agencyTotal) }}</span>
            <span class="status-chip">Agent pool: {{ formatCurrency(reportsSummary.commissionSummary.agentPoolTotal) }}</span>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-body space-y-3">
          <AppSectionHeader title="Top Agents" description="Closed deal leaders in the current summary.">
            <template #actions>
              <NuxtLink to="/reports" class="btn-secondary">View</NuxtLink>
            </template>
          </AppSectionHeader>
          <ul v-if="dashboardTopAgents.length > 0" class="space-y-2">
            <li v-for="agent in dashboardTopAgents" :key="agent.agentId" class="flex items-center justify-between gap-3 text-sm">
              <span class="truncate font-medium text-slate-700 dark:text-slate-300">{{ agent.agentName }}</span>
              <span class="shrink-0 text-xs text-slate-500">{{ agent.closedDeals }} closed</span>
            </li>
          </ul>
          <p v-else class="text-xs text-slate-500">Closed deal rankings will appear here.</p>
        </div>
      </article>
    </section>

    <section class="grid gap-4 xl:grid-cols-3">
      <article class="panel xl:col-span-1">
        <div class="panel-body space-y-3">
          <AppSectionHeader title="Task Snapshot" description="Open tasks across the office.">
            <template #actions>
              <NuxtLink to="/tasks" class="btn-secondary">Open Tasks</NuxtLink>
            </template>
          </AppSectionHeader>
          <p class="text-3xl font-semibold text-slate-950 dark:text-white">
            {{ tasksStore.summary.pending }}
          </p>
          <div class="grid gap-2 text-xs sm:grid-cols-3">
            <span class="status-chip">Overdue: {{ tasksStore.summary.overdue }}</span>
            <span class="status-chip">Today: {{ tasksStore.summary.dueToday }}</span>
            <span class="status-chip">Week: {{ tasksStore.summary.dueThisWeek }}</span>
          </div>
        </div>
      </article>

      <article class="panel xl:col-span-2">
        <div class="panel-body">
          <AppSectionHeader title="Recent Transaction Activity" description="Latest notes and operational updates.">
            <template #actions>
              <button
                type="button"
                class="btn-secondary"
                @click="transactionNotesStore.fetchRecentNotes().catch(() => undefined)"
              >
                Refresh
              </button>
            </template>
          </AppSectionHeader>
          <ul v-if="transactionNotesStore.recentItems.length > 0" class="space-y-2">
            <li
              v-for="note in transactionNotesStore.recentItems"
              :key="note.id"
              class="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/70"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="font-medium text-slate-800 dark:text-slate-200">
                  {{ note.transaction?.propertyTitle ?? 'Transaction note' }}
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ formatDateTime(note.createdAt) }}
                </p>
              </div>
              <p class="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                {{ note.author?.name ?? 'Unknown author' }}: {{ note.content }}
              </p>
            </li>
          </ul>
          <AppEmptyState v-else title="No recent transaction notes yet" description="Activity will appear here once the team starts adding workflow notes." />
        </div>
      </article>
    </section>

    <section class="grid gap-4 xl:grid-cols-3">
      <article class="panel xl:col-span-1">
        <div class="panel-body space-y-4">
          <AppSectionHeader title="My Balance" :description="`Total earned: ${balanceSummary ? formatCurrency(balanceSummary.totalEarned) : '$0.00'}`">
            <template #actions>
              <NuxtLink to="/balance" class="btn-secondary">Open Balance</NuxtLink>
            </template>
          </AppSectionHeader>
          <p class="text-3xl font-semibold text-slate-950 dark:text-white">
            {{ balanceSummary ? formatCurrency(balanceSummary.balance) : '$0.00' }}
          </p>

          <div v-if="balanceStore.summaryError" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {{ balanceStore.summaryError }}
          </div>
        </div>
      </article>

      <article class="panel xl:col-span-2">
        <div class="panel-body">
          <AppSectionHeader title="Recent Balance Movements" description="Latest credits, adjustments, and reversals.">
            <template #actions>
              <button
                type="button"
                class="btn-secondary"
                :disabled="balanceStore.isLoadingSummary"
                @click="balanceStore.fetchSummary().catch(() => undefined)"
              >
                {{ balanceStore.isLoadingSummary ? 'Loading...' : 'Refresh' }}
              </button>
            </template>
          </AppSectionHeader>

          <div v-if="balanceStore.isLoadingSummary && !balanceSummary" class="space-y-2">
            <div class="skeleton h-10 w-full"></div>
            <div class="skeleton h-10 w-full"></div>
          </div>

          <ul v-else-if="recentBalanceMovements.length > 0" class="space-y-2">
            <li
              v-for="entry in recentBalanceMovements"
              :key="entry.id"
              class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/70"
            >
              <div>
                <p class="font-medium text-slate-800 dark:text-slate-200">
                  {{ getLedgerMovementLabel(entry.type) }}
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ entry.description }}</p>
              </div>
              <div class="text-right">
                <p
                  class="font-semibold"
                  :class="entry.amountCents >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'"
                >
                  {{ formatCurrency(entry.amount) }}
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ formatDateTime(entry.createdAt) }}
                </p>
              </div>
            </li>
          </ul>

          <AppEmptyState
            v-else
            title="No balance movements yet"
            description="Completed transactions will generate commission credits here."
          />
        </div>
      </article>
    </section>

    <div v-if="transactionsStore.error" class="alert-error flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="font-medium">{{ t('transactions.errors.syncTitle') }}</p>
        <p class="mt-0.5 text-xs text-rose-700/90 dark:text-rose-300">{{ transactionsStore.error }}</p>
      </div>
      <button
        type="button"
        class="btn-secondary border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50"
        @click="handleRefresh"
      >
        {{ t('transactions.actions.retry') }}
      </button>
    </div>

    <div
      v-if="actionSuccessMessage"
      class="alert-success"
    >
      <div class="flex items-center justify-between gap-3">
        <p>{{ actionSuccessMessage }}</p>
        <button type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="actionSuccessMessage = ''">
          Dismiss
        </button>
      </div>
    </div>

    <div v-if="isInitialLoading" class="grid gap-6">
      <div class="panel">
        <div class="panel-body space-y-4">
          <div class="skeleton h-5 w-44"></div>
          <div class="skeleton h-40 w-full"></div>
          <div class="skeleton h-40 w-full"></div>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <TransactionListControls
        :search-query="searchQuery"
        :stage-filter="stageFilter"
        :transaction-type-filter="transactionTypeFilter"
        :sort-by="sortBy"
        :include-deleted="includeDeleted"
        :can-include-deleted="canIncludeDeleted"
        :disabled="transactionsStore.isLoading"
        @update:search-query="searchQuery = $event"
        @update:stage-filter="stageFilter = $event"
        @update:transaction-type-filter="transactionTypeFilter = $event"
        @update:sort-by="sortBy = $event"
        @update:include-deleted="includeDeleted = $event"
        @clear="clearFilters"
      />

      <TransactionList
        :transactions="transactionsStore.items"
        :stage-update-transaction-id="transactionsStore.stageUpdateTransactionId"
        :update-transaction-id="transactionsStore.updateTransactionId"
        :delete-transaction-id="transactionsStore.deleteTransactionId"
        :get-next-stage="transactionsStore.getNextStage"
        :can-view-deleted-metadata="canViewDeletedMetadata"
        :is-refreshing="isRefreshing"
        :compact-mode="isCompactCardsEnabled"
        :empty-title="emptyStateTitle"
        :empty-description="emptyStateDescription"
        :current-user-id="authStore.currentUser?.id ?? null"
        :current-user-role="authStore.currentUser?.role ?? null"
        @stage-change="handleStageChange"
        @edit="handleEditClick"
        @delete="handleDeleteClick"
      />

      <div
        v-if="totalPages > 1"
        class="panel"
      >
        <div class="panel-body flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-slate-600 dark:text-slate-300">
            Page {{ currentPage }} of {{ totalPages }}
          </p>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn-secondary"
              :disabled="transactionsStore.isLoading || currentPage <= 1"
              @click="goToPreviousPage"
            >
              Previous
            </button>
            <button
              type="button"
              class="btn-secondary"
              :disabled="transactionsStore.isLoading || currentPage >= totalPages"
              @click="goToNextPage"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <TransactionEditModal
      :is-open="isEditModalOpen"
      :transaction="selectedEditTransaction"
      :agents="authStore.activeUsers"
      :clients="clientsStore.items"
      :properties="propertiesStore.items"
      :is-submitting="Boolean(transactionsStore.updateTransactionId)"
      @close="handleEditClose"
      @submit="handleEditSubmit"
    />
  </section>
</template>
