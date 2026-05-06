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
  <section class="space-y-8">
    <AppPageHeader
      eyebrow="Office Analytics"
      title="Reports"
      description="Review organization-scoped production, commission, task, and activity trends."
      meta="Executive reporting for transactions, properties, tasks, and commission movement."
    >
      <template #actions>
        <button type="button" class="btn-secondary" :disabled="reportsStore.isLoading" @click="applyFilters">
          {{ reportsStore.isLoading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </template>
    </AppPageHeader>

    <section class="panel">
      <div class="panel-body space-y-4">
        <AppSectionHeader title="Report Filters" description="Scope analytics by date, deal type, lifecycle stage, property listing, or status." />
        <form class="grid gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40 md:grid-cols-6" @submit.prevent="applyFilters">
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
      </div>
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
          <AppSectionHeader title="Transactions by Stage" description="Lifecycle visibility across filtered transactions.">
            <template #actions>
              <NuxtLink to="/transactions" class="btn-secondary">Open</NuxtLink>
            </template>
          </AppSectionHeader>
          <div v-if="summary.transactionCountsByStage.length > 0" class="space-y-3">
            <div v-for="item in summary.transactionCountsByStage" :key="item.key" class="space-y-1">
              <div class="flex justify-between text-sm">
                <span class="font-medium text-slate-700 dark:text-slate-300">{{ formatStageLabel(item.key) }}</span>
                <span class="text-slate-500 dark:text-slate-400">{{ item.count }}</span>
              </div>
              <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <div class="h-2 rounded-full bg-brand-600" :style="{ width: `${Math.max(6, (item.count / maxStageCount) * 100)}%` }" />
              </div>
            </div>
          </div>
          <AppEmptyState v-else title="No transaction data" description="Adjust report filters to widen the stage view." />
        </div>
      </article>

      <article class="panel">
        <div class="panel-body space-y-4">
          <AppSectionHeader title="Service Fee Trend" description="Monthly service fee movement for the active filter set." />
          <div v-if="summary.totalServiceFeeOverTime.length > 0" class="flex h-48 items-end gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
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
          <AppEmptyState v-else title="No fee trend yet" description="Trend bars will appear after transactions carry service fee data." />
        </div>
      </article>
    </section>

    <section class="grid gap-4 xl:grid-cols-3">
      <article class="panel xl:col-span-2">
        <div class="panel-body">
          <AppSectionHeader title="Agent Performance" description="Closed-deal output and commission earnings by agent." />
          <div v-if="topAgents.length > 0" class="mt-5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Closed Deals</th>
                  <th>Commission</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="agent in topAgents" :key="agent.agentId">
                  <td class="font-medium text-slate-900 dark:text-slate-100">{{ agent.agentName }}</td>
                  <td>{{ agent.closedDeals }}</td>
                  <td>{{ formatCurrency(agent.totalCommissionEarnings) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <AppEmptyState v-else title="No agent performance data yet" description="Closed transactions will populate this leaderboard." />
        </div>
      </article>

      <article class="panel">
        <div class="panel-body space-y-4">
          <AppSectionHeader title="Recent Activity" description="Latest reportable movement in the workspace." />
          <ul v-if="summary.recentActivity.length > 0" class="space-y-2">
            <li
              v-for="item in summary.recentActivity"
              :key="`${item.type}-${item.occurredAt}-${item.title}`"
              class="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40"
            >
              <p class="line-clamp-1 text-sm font-medium">{{ item.title }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ formatDateTime(item.occurredAt) }}</p>
            </li>
          </ul>
          <AppEmptyState v-else title="No recent activity yet" description="Recent transactions, tasks, and property updates will appear here." />
        </div>
      </article>
    </section>

    <section v-if="canExport" class="panel">
      <div class="panel-body flex flex-wrap items-center justify-between gap-3">
        <AppSectionHeader title="Exports" description="CSV files respect the active report filters and organization scope." />
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
  </section>
</template>
