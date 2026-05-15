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
const { t, formatCurrency, formatDateTime, getStageLabel } = useAppI18n();

useHead(() => ({
  title: t('reports.meta.title')
}));

const filterForm = reactive({
  dateFrom: '',
  dateTo: '',
  transactionType: '',
  transactionStage: '',
  propertyListingType: '',
  status: ''
});

const transactionTypeOptions = computed(() => [
  { value: TransactionType.SOLD, label: t('transactionTypes.sold') },
  { value: TransactionType.RENTED, label: t('transactionTypes.rented') }
]);
const transactionStageOptions = computed(() => [
  { value: TransactionStage.AGREEMENT, label: getStageLabel(TransactionStage.AGREEMENT) },
  { value: TransactionStage.EARNEST_MONEY, label: getStageLabel(TransactionStage.EARNEST_MONEY) },
  { value: TransactionStage.TITLE_DEED, label: getStageLabel(TransactionStage.TITLE_DEED) },
  { value: TransactionStage.COMPLETED, label: getStageLabel(TransactionStage.COMPLETED) }
]);
const propertyListingTypeOptions = computed(() =>
  PROPERTY_LISTING_TYPE_OPTIONS.map((option) => ({
    ...option,
    label: t(`property.listingTypes.${option.value}`)
  }))
);
const statusOptions = computed(() => [
  ...PROPERTY_STATUS_OPTIONS.map((option) => ({
    ...option,
    label: t(`property.statuses.${option.value}`)
  })),
  ...TASK_STATUS_OPTIONS.map((option) => ({
    ...option,
    label: t(`tasks.statuses.${option.value}`)
  }))
]);
const exportOptions = computed<Array<{ kind: ReportExportKind; label: string }>>(() => [
  { kind: 'transactions', label: t('reports.export.transactions') },
  { kind: 'clients', label: t('reports.export.clients') },
  { kind: 'properties', label: t('reports.export.properties') },
  { kind: 'tasks', label: t('reports.export.tasks') },
  { kind: 'commissions', label: t('reports.export.commissions') }
]);

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
      :eyebrow="t('reports.header.kicker')"
      :title="t('reports.header.title')"
      :description="t('reports.header.description')"
      :meta="t('reports.header.meta')"
    >
      <template #actions>
        <button type="button" class="btn-secondary" :disabled="reportsStore.isLoading" @click="applyFilters">
          {{ reportsStore.isLoading ? t('common.refreshing') : t('common.refresh') }}
        </button>
      </template>
    </AppPageHeader>

    <section class="panel">
      <div class="panel-body space-y-4">
        <AppSectionHeader :title="t('reports.filters.title')" :description="t('reports.filters.description')" />
        <form class="grid gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40 md:grid-cols-6" @submit.prevent="applyFilters">
          <label class="block">
            <span class="field-label">{{ t('reports.filters.dateFrom') }}</span>
            <input v-model="filterForm.dateFrom" type="date" class="input-base" />
          </label>
          <label class="block">
            <span class="field-label">{{ t('reports.filters.dateTo') }}</span>
            <input v-model="filterForm.dateTo" type="date" class="input-base" />
          </label>
          <label class="block">
            <span class="field-label">{{ t('reports.filters.type') }}</span>
            <select v-model="filterForm.transactionType" class="input-base">
              <option value="">{{ t('common.all') }}</option>
              <option v-for="option in transactionTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label class="block">
            <span class="field-label">{{ t('reports.filters.stage') }}</span>
            <select v-model="filterForm.transactionStage" class="input-base">
              <option value="">{{ t('common.all') }}</option>
              <option v-for="option in transactionStageOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label class="block">
            <span class="field-label">{{ t('reports.filters.listing') }}</span>
            <select v-model="filterForm.propertyListingType" class="input-base">
              <option value="">{{ t('common.all') }}</option>
              <option v-for="option in propertyListingTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label class="block">
            <span class="field-label">{{ t('reports.filters.status') }}</span>
            <select v-model="filterForm.status" class="input-base">
              <option value="">{{ t('common.all') }}</option>
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <div class="flex flex-wrap items-end gap-2 md:col-span-6">
            <button type="submit" class="btn-primary" :disabled="reportsStore.isLoading">{{ t('reports.filters.applyFilters') }}</button>
            <button type="button" class="btn-secondary" :disabled="reportsStore.isLoading" @click="clearFilters">
              {{ t('reports.filters.clearFilters') }}
            </button>
          </div>
        </form>
      </div>
    </section>

    <div v-if="reportsStore.error" class="alert-error">{{ reportsStore.error }}</div>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard :label="t('reports.metrics.monthlyServiceFee')" :value="formatCurrency(summary.monthlyServiceFee)" :helper="t('reports.helpers.currentCalendarMonth')" emphasis />
      <MetricCard :label="t('reports.metrics.agencyTotal')" :value="formatCurrency(summary.commissionSummary.agencyTotal)" :helper="t('reports.helpers.completedDeals')" />
      <MetricCard :label="t('reports.metrics.agentEarnings')" :value="formatCurrency(summary.commissionSummary.agentEarningsTotal)" :helper="t('reports.helpers.commissionAllocations')" />
      <MetricCard :label="t('reports.metrics.overdueTasks')" :value="String(summary.taskSummary.overdue)" :helper="t('reports.helpers.openTasksBeforeToday')" />
    </section>

    <section class="grid gap-4 xl:grid-cols-2">
      <article class="panel">
        <div class="panel-body space-y-4">
          <AppSectionHeader :title="t('reports.sections.transactionsByStage')" :description="t('reports.sections.transactionsByStageDescription')">
            <template #actions>
              <NuxtLink to="/transactions" class="btn-secondary">{{ t('common.open') }}</NuxtLink>
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
          <AppEmptyState v-else :title="t('reports.empty.noTransactionData')" :description="t('reports.empty.noTransactionDataDescription')" />
        </div>
      </article>

      <article class="panel">
        <div class="panel-body space-y-4">
          <AppSectionHeader :title="t('reports.sections.serviceFeeTrend')" :description="t('reports.sections.serviceFeeTrendDescription')" />
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
          <AppEmptyState v-else :title="t('reports.empty.noFeeTrend')" :description="t('reports.empty.noFeeTrendDescription')" />
        </div>
      </article>
    </section>

    <section class="grid gap-4 xl:grid-cols-3">
      <article class="panel xl:col-span-2">
        <div class="panel-body">
          <AppSectionHeader :title="t('reports.sections.agentPerformance')" :description="t('reports.sections.agentPerformanceDescription')" />
          <div v-if="topAgents.length > 0" class="mt-5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('reports.table.agent') }}</th>
                  <th>{{ t('reports.table.closedDeals') }}</th>
                  <th>{{ t('reports.table.commission') }}</th>
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
          <AppEmptyState v-else :title="t('reports.empty.noAgentPerformance')" :description="t('reports.empty.noAgentPerformanceDescription')" />
        </div>
      </article>

      <article class="panel">
        <div class="panel-body space-y-4">
          <AppSectionHeader :title="t('reports.sections.recentActivity')" :description="t('reports.sections.recentActivityDescription')" />
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
          <AppEmptyState v-else :title="t('reports.empty.noRecentActivity')" :description="t('reports.empty.noRecentActivityDescription')" />
        </div>
      </article>
    </section>

    <section v-if="canExport" class="panel">
      <div class="panel-body flex flex-wrap items-center justify-between gap-3">
        <AppSectionHeader :title="t('reports.sections.exports')" :description="t('reports.sections.exportsDescription')" />
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in exportOptions"
            :key="option.kind"
            type="button"
            class="btn-secondary"
            :disabled="Boolean(reportsStore.exportKind)"
            @click="reportsStore.exportCsv(option.kind)"
          >
            {{ reportsStore.exportKind === option.kind ? t('reports.export.exporting') : option.label }}
          </button>
        </div>
      </div>
    </section>
  </section>
</template>
