<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';

import MetricCard from '~/components/dashboard/MetricCard.vue';
import { useAppI18n } from '~/composables/useAppI18n';
import { useAuthStore } from '~/stores/auth';
import { useReportsStore } from '~/stores/reports';
import {
  PROPERTY_LISTING_TYPE_OPTIONS,
  PROPERTY_STATUS_OPTIONS,
  type PropertyListingType,
  type PropertyStatus
} from '~/types/property';
import type { ReportExportKind, ReportFilters } from '~/types/report';
import { TASK_STATUS_OPTIONS, type TaskStatus } from '~/types/task';
import {
  TransactionStage,
  TransactionType,
  type TransactionStage as TransactionStageType,
  type TransactionType as TransactionTypeType
} from '~/types/transaction';

const reportsStore = useReportsStore();
const authStore = useAuthStore();
const { formatCurrency, formatDateTime, getStageLabel } = useAppI18n();

useHead({
  title: 'Reports | Iceberg'
});

const filterForm = reactive({
  dateFrom: '',
  dateTo: '',
  transactionType: '',
  transactionStage: '',
  propertyListingType: '',
  status: ''
});

const transactionTypeOptions = [
  { value: TransactionType.SOLD, label: 'Sold' },
  { value: TransactionType.RENTED, label: 'Rented' }
];
const transactionStageOptions = [
  { value: TransactionStage.AGREEMENT, label: 'Agreement' },
  { value: TransactionStage.EARNEST_MONEY, label: 'Earnest Money' },
  { value: TransactionStage.TITLE_DEED, label: 'Title Deed' },
  { value: TransactionStage.COMPLETED, label: 'Completed' }
];
const statusOptions = [...PROPERTY_STATUS_OPTIONS, ...TASK_STATUS_OPTIONS];
const exportOptions: Array<{ kind: ReportExportKind; label: string }> = [
  { kind: 'transactions', label: 'Transactions' },
  { kind: 'clients', label: 'Clients' },
  { kind: 'properties', label: 'Properties' },
  { kind: 'tasks', label: 'Tasks' },
  { kind: 'commissions', label: 'Commissions' }
];

const canExport = computed(() => {
  const role = authStore.currentUser?.role;
  return (
    role === 'super_admin' ||
    role === 'office_owner' ||
    role === 'admin' ||
    role === 'manager' ||
    role === 'finance'
  );
});
const summary = computed(() => reportsStore.summary);
const maxStageCount = computed(() =>
  Math.max(1, ...summary.value.transactionCountsByStage.map((item) => item.count))
);
const maxTrendValue = computed(() =>
  Math.max(
    1,
    ...summary.value.totalServiceFeeOverTime.map((item) => item.totalServiceFee ?? 0)
  )
);
const topAgents = computed(() => summary.value.agentPerformance.slice(0, 5));
const formatStageLabel = (stage: string): string => getStageLabel(stage as TransactionStageType);

const buildFilters = (): ReportFilters => ({
  dateFrom: filterForm.dateFrom || undefined,
  dateTo: filterForm.dateTo || undefined,
  transactionType: (filterForm.transactionType || undefined) as TransactionTypeType | undefined,
  transactionStage: (filterForm.transactionStage || undefined) as TransactionStageType | undefined,
  propertyListingType: (filterForm.propertyListingType || undefined) as
    | PropertyListingType
    | undefined,
  status: (filterForm.status || undefined) as PropertyStatus | TaskStatus | undefined
});

const applyFilters = async () => {
  await reportsStore.fetchSummary(buildFilters());
};

const clearFilters = async () => {
  filterForm.dateFrom = '';
  filterForm.dateTo = '';
  filterForm.transactionType = '';
  filterForm.transactionStage = '';
  filterForm.propertyListingType = '';
  filterForm.status = '';
  await applyFilters();
};

onMounted(() => {
  applyFilters().catch(() => undefined);
});
</script>

<template>
  <main class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">
          Office Analytics
        </p>
        <h1 class="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Reports
        </h1>
        <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Review organization-scoped production, commission, task, and activity trends.
        </p>
      </div>
      <button type="button" class="btn-secondary" :disabled="reportsStore.isLoading" @click="applyFilters">
        {{ reportsStore.isLoading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </header>

    <section class="panel">
      <form class="panel-body grid gap-4 md:grid-cols-6" @submit.prevent="applyFilters">
        <label class="block">
          <span class="field-label">From</span>
          <input v-model="filterForm.dateFrom" type="date" class="input-base" />
        </label>
        <label class="block">
          <span class="field-label">To</span>
          <input v-model="filterForm.dateTo" type="date" class="input-base" />
        </label>
        <label class="block">
          <span class="field-label">Type</span>
          <select v-model="filterForm.transactionType" class="input-base">
            <option value="">All</option>
            <option v-for="option in transactionTypeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="field-label">Stage</span>
          <select v-model="filterForm.transactionStage" class="input-base">
            <option value="">All</option>
            <option v-for="option in transactionStageOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="field-label">Listing</span>
          <select v-model="filterForm.propertyListingType" class="input-base">
            <option value="">All</option>
            <option v-for="option in PROPERTY_LISTING_TYPE_OPTIONS" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="field-label">Status</span>
          <select v-model="filterForm.status" class="input-base">
            <option value="">All</option>
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <div class="flex flex-wrap items-end gap-2 md:col-span-6">
          <button type="submit" class="btn-primary" :disabled="reportsStore.isLoading">Apply</button>
          <button type="button" class="btn-secondary" :disabled="reportsStore.isLoading" @click="clearFilters">
            Clear
          </button>
        </div>
      </form>
    </section>

    <div v-if="reportsStore.error" class="alert-error">{{ reportsStore.error }}</div>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Monthly Service Fee" :value="formatCurrency(summary.monthlyServiceFee)" helper="Current calendar month" emphasis />
      <MetricCard label="Agency Total" :value="formatCurrency(summary.commissionSummary.agencyTotal)" helper="Completed deals" />
      <MetricCard label="Agent Earnings" :value="formatCurrency(summary.commissionSummary.agentEarningsTotal)" helper="Commission allocations" />
      <MetricCard label="Overdue Tasks" :value="String(summary.taskSummary.overdue)" helper="Open tasks before today" />
    </section>

    <section class="grid gap-4 xl:grid-cols-2">
      <article class="panel">
        <div class="panel-body space-y-4">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Transactions by Stage</h2>
            <NuxtLink to="/transactions" class="btn-secondary">Open</NuxtLink>
          </div>
          <div class="space-y-3">
            <div v-for="item in summary.transactionCountsByStage" :key="item.key" class="space-y-1">
              <div class="flex justify-between text-sm">
                <span class="font-medium text-slate-700 dark:text-slate-300">{{ formatStageLabel(item.key) }}</span>
                <span class="text-slate-500 dark:text-slate-400">{{ item.count }}</span>
              </div>
              <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <div class="h-2 rounded-full bg-brand-600" :style="{ width: `${Math.max(6, (item.count / maxStageCount) * 100)}%` }" />
              </div>
            </div>
            <p v-if="summary.transactionCountsByStage.length === 0" class="empty-state text-sm">
              No transaction data for this filter.
            </p>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-body space-y-4">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Service Fee Trend</h2>
          <div class="flex h-48 items-end gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
            <div
              v-for="item in summary.totalServiceFeeOverTime"
              :key="item.period"
              class="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <div
                class="w-full rounded-t-md bg-sky-500"
                :style="{ height: `${Math.max(8, ((item.totalServiceFee ?? 0) / maxTrendValue) * 170)}px` }"
                :title="formatCurrency(item.totalServiceFee ?? 0)"
              />
              <span class="w-full truncate text-center text-[11px] text-slate-500">{{ item.period }}</span>
            </div>
          </div>
          <p v-if="summary.totalServiceFeeOverTime.length === 0" class="empty-state text-sm">
            No fee trend yet.
          </p>
        </div>
      </article>
    </section>

    <section class="grid gap-4 xl:grid-cols-3">
      <article class="panel xl:col-span-2">
        <div class="panel-body">
          <h2 class="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Agent Performance</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="text-xs uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th class="px-3 py-2">Agent</th>
                  <th class="px-3 py-2">Closed Deals</th>
                  <th class="px-3 py-2">Commission</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
                <tr v-for="agent in topAgents" :key="agent.agentId">
                  <td class="px-3 py-3 font-medium">{{ agent.agentName }}</td>
                  <td class="px-3 py-3">{{ agent.closedDeals }}</td>
                  <td class="px-3 py-3">{{ formatCurrency(agent.totalCommissionEarnings) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="topAgents.length === 0" class="empty-state text-sm">No agent performance data yet.</p>
        </div>
      </article>

      <article class="panel">
        <div class="panel-body space-y-4">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h2>
          <ul class="space-y-2">
            <li
              v-for="item in summary.recentActivity"
              :key="`${item.type}-${item.occurredAt}-${item.title}`"
              class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
            >
              <p class="line-clamp-1 text-sm font-medium">{{ item.title }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ formatDateTime(item.occurredAt) }}</p>
            </li>
          </ul>
          <p v-if="summary.recentActivity.length === 0" class="empty-state text-sm">No recent activity yet.</p>
        </div>
      </article>
    </section>

    <section v-if="canExport" class="panel">
      <div class="panel-body flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Exports</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            CSV files respect the active report filters and organization scope.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in exportOptions"
            :key="option.kind"
            type="button"
            class="btn-secondary"
            :disabled="Boolean(reportsStore.exportKind)"
            @click="reportsStore.exportCsv(option.kind)"
          >
            {{ reportsStore.exportKind === option.kind ? 'Exporting...' : option.label }}
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
