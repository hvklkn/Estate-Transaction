<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import TransactionStageBadge from '~/components/transactions/TransactionStageBadge.vue';
import { useAppI18n } from '~/composables/useAppI18n';
import { useAuthStore } from '~/stores/auth';
import { useBalanceStore } from '~/stores/balance';
import { useTransactionsStore } from '~/stores/transactions';
import { TransactionStage } from '~/types/transaction';
import type { BalanceLedgerType } from '~/types/balance';

const authStore = useAuthStore();
const balanceStore = useBalanceStore();
const transactionsStore = useTransactionsStore();
const { t, formatCurrency, formatDateTime } = useAppI18n();

useHead(() => ({
  title: t('balance.meta.title')
}));

const typeFilter = ref<BalanceLedgerType | 'all'>('all');
const dateFrom = ref('');
const dateTo = ref('');

const summary = computed(() => balanceStore.summary);
const ledger = computed(() => balanceStore.ledger);
const currentUserId = computed(() => authStore.currentUser?.id ?? null);
const mySales = computed(() => {
  if (!currentUserId.value) {
    return [];
  }

  return transactionsStore.items
    .filter((transaction) => transaction.sellingAgentId === currentUserId.value)
    .sort((left, right) => {
      const leftDate = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightDate = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightDate - leftDate;
    });
});
const completedSalesCount = computed(
  () => mySales.value.filter((transaction) => transaction.stage === TransactionStage.COMPLETED).length
);
const totalSalesVolume = computed(() =>
  mySales.value.reduce((sum, transaction) => sum + transaction.totalServiceFee, 0)
);
const totalSalesEarnings = computed(() => {
  if (!currentUserId.value) {
    return 0;
  }

  return mySales.value.reduce((sum, transaction) => {
    const earning = transaction.financialBreakdown.agents
      .filter((agent) => agent.agentId === currentUserId.value)
      .reduce((agentTotal, agent) => agentTotal + agent.amount, 0);

    return sum + earning;
  }, 0);
});
const currentPage = computed(() => ledger.value.page);
const totalPages = computed(() => ledger.value.totalPages);
const showingRange = computed(() => {
  if (ledger.value.total === 0) {
    return '0-0';
  }

  const first = (ledger.value.page - 1) * ledger.value.limit + 1;
  const last = Math.min(ledger.value.page * ledger.value.limit, ledger.value.total);

  return `${first}-${last}`;
});
const hasInitialLoading = computed(
  () => (balanceStore.isLoadingSummary || balanceStore.isLoadingLedger) && !summary.value
);
const hasLedgerFilters = computed(
  () => typeFilter.value !== 'all' || Boolean(dateFrom.value) || Boolean(dateTo.value)
);
const ledgerEmptyTitle = computed(() =>
  hasLedgerFilters.value ? t('balance.empty.noLedgerRowsFiltered') : t('balance.empty.noBalanceMovements')
);
const ledgerEmptyDescription = computed(() =>
  hasLedgerFilters.value
    ? t('balance.empty.ledgerFilteredDescription')
    : t('balance.empty.noBalanceMovementsDescription')
);

const getLedgerTypeLabel = (type: BalanceLedgerType): string => {
  switch (type) {
      case 'commission_credit':
      return t('balance.ledgerTypes.commission_credit');
    case 'manual_adjustment':
      return t('balance.ledgerTypes.manual_adjustment');
    case 'reversal':
      return t('balance.ledgerTypes.reversal');
    default:
      return type;
  }
};

const getAmountClasses = (amountCents: number): string => {
  if (amountCents > 0) {
    return 'text-emerald-700 dark:text-emerald-300';
  }

  if (amountCents < 0) {
    return 'text-rose-700 dark:text-rose-300';
  }

  return 'text-slate-700 dark:text-slate-200';
};

const applyFilters = async (page = 1) => {
  await balanceStore.fetchLedger({
    query: {
      page,
      type: typeFilter.value === 'all' ? null : typeFilter.value,
      dateFrom: dateFrom.value,
      dateTo: dateTo.value
    }
  });
};

const clearFilters = async () => {
  typeFilter.value = 'all';
  dateFrom.value = '';
  dateTo.value = '';
  await applyFilters(1);
};

const refreshPage = async () => {
  await Promise.all([balanceStore.fetchSummary(), applyFilters(currentPage.value), loadSales()]);
};

const goToPreviousPage = async () => {
  if (currentPage.value <= 1) {
    return;
  }

  await applyFilters(currentPage.value - 1);
};

const goToNextPage = async () => {
  if (currentPage.value >= totalPages.value) {
    return;
  }

  await applyFilters(currentPage.value + 1);
};

const loadSales = async () => {
  await transactionsStore.fetchTransactions({
    force: true,
    query: {
      page: 1,
      limit: 100
    }
  });
};

onMounted(async () => {
  authStore.hydrateFromStorage();
  await Promise.all([
    balanceStore.fetchSummary().catch(() => undefined),
    applyFilters(1).catch(() => undefined),
    loadSales().catch(() => undefined)
  ]);
});
</script>

<template>
  <section class="space-y-8">
    <AppPageHeader
      :eyebrow="t('balance.header.kicker')"
      :title="t('balance.header.title')"
      :description="t('balance.header.description')"
      :meta="t('balance.sections.ledgerMeta', { range: showingRange, total: ledger.total })"
    >
      <template #actions>
        <button
          type="button"
          class="btn-secondary"
          :disabled="balanceStore.isLoadingSummary || balanceStore.isLoadingLedger"
          @click="refreshPage"
        >
          {{ balanceStore.isLoadingSummary || balanceStore.isLoadingLedger ? t('common.refreshing') : t('common.refresh') }}
        </button>
      </template>
    </AppPageHeader>

    <div class="grid gap-4 md:grid-cols-3">
      <article class="panel">
        <div class="panel-body">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{{ t('balance.metrics.currentBalance') }}</p>
          <p class="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
            {{ summary ? formatCurrency(summary.balance) : formatCurrency(0) }}
          </p>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ t('balance.metrics.currentBalanceHelper') }}</p>
        </div>
      </article>

      <article class="panel">
        <div class="panel-body">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{{ t('balance.metrics.totalEarned') }}</p>
          <p class="mt-2 text-3xl font-semibold text-emerald-700 dark:text-emerald-300">
            {{ summary ? formatCurrency(summary.totalEarned) : formatCurrency(0) }}
          </p>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ t('balance.metrics.totalEarnedHelper') }}</p>
        </div>
      </article>

      <article class="panel">
        <div class="panel-body">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{{ t('balance.metrics.recentMovements') }}</p>
          <p class="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
            {{ summary?.recentLedgerEntries.length ?? 0 }}
          </p>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ t('balance.metrics.recentMovementsHelper') }}</p>
        </div>
      </article>
    </div>

    <article class="panel">
      <div class="panel-body space-y-5">
        <AppSectionHeader :title="t('balance.sections.salesRecords')" :description="t('balance.sections.salesRecordsDescription')">
          <template #actions>
            <div class="flex flex-wrap gap-2">
              <span class="status-chip">{{ t('balance.sections.totalSales') }}: {{ mySales.length }}</span>
              <span class="status-chip">{{ t('balance.sections.completed') }}: {{ completedSalesCount }}</span>
              <span class="status-chip">{{ t('balance.sections.volume') }}: {{ formatCurrency(totalSalesVolume) }}</span>
              <span class="status-chip">{{ t('balance.sections.earnings') }}: {{ formatCurrency(totalSalesEarnings) }}</span>
            </div>
          </template>
        </AppSectionHeader>

        <div v-if="transactionsStore.error" class="alert-error">
          {{ transactionsStore.error }}
        </div>

        <div v-else-if="transactionsStore.isLoading && mySales.length === 0" class="space-y-3">
          <div class="skeleton h-14 w-full"></div>
          <div class="skeleton h-14 w-full"></div>
        </div>

        <AppEmptyState
          v-else-if="mySales.length === 0"
          :title="t('balance.empty.noSales')"
          :description="t('balance.empty.noSalesDescription')"
        />

        <div v-else class="record-list">
          <article
            v-for="transaction in mySales"
            :key="transaction.id"
            class="record-row rounded-2xl px-1"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ transaction.propertyTitle }}</h3>
                <p class="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {{ t('balance.sections.transactionId') }}: {{ transaction.id }}
                </p>
              </div>
              <TransactionStageBadge :stage="transaction.stage" />
            </div>

            <div class="mt-3 grid gap-3 sm:grid-cols-3">
              <div class="surface-muted px-3 py-2">
                <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{{ t('balance.sections.serviceFee') }}</p>
                <p class="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{{ formatCurrency(transaction.totalServiceFee) }}</p>
              </div>

              <div class="surface-muted px-3 py-2">
                <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{{ t('balance.sections.yourEarning') }}</p>
                <p class="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {{
                    formatCurrency(
                      transaction.financialBreakdown.agents
                        .filter((agent) => agent.agentId === currentUserId)
                        .reduce((sum, agent) => sum + agent.amount, 0)
                    )
                  }}
                </p>
              </div>

              <div class="surface-muted px-3 py-2">
                <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{{ t('balance.sections.createdAt') }}</p>
                <p class="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{{ formatDateTime(transaction.createdAt) }}</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </article>

    <div v-if="balanceStore.summaryError" class="alert-error flex items-center justify-between gap-3">
      <div>
        <p class="font-medium">{{ t('balance.sections.summaryError') }}</p>
        <p class="mt-0.5 text-xs text-rose-700/90 dark:text-rose-300">{{ balanceStore.summaryError }}</p>
      </div>
      <button type="button" class="btn-secondary" @click="balanceStore.fetchSummary().catch(() => undefined)">
        {{ t('common.retry') }}
      </button>
    </div>

    <section class="panel">
      <div class="panel-body space-y-4">
        <AppSectionHeader :title="t('balance.sections.ledgerHistory')" :description="t('balance.sections.ledgerMeta', { range: showingRange, total: ledger.total })">
          <template #actions>
            <NuxtLink to="/transactions" class="btn-secondary">{{ t('balance.sections.backToTransactions') }}</NuxtLink>
          </template>
        </AppSectionHeader>

        <form class="grid gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40 lg:grid-cols-5" @submit.prevent="applyFilters(1)">
          <label class="block">
            <span class="field-label">{{ t('balance.filters.type') }}</span>
            <select v-model="typeFilter" class="input-base text-sm">
              <option value="all">{{ t('common.all') }}</option>
              <option value="commission_credit">{{ t('balance.ledgerTypes.commission_credit') }}</option>
              <option value="manual_adjustment">{{ t('balance.ledgerTypes.manual_adjustment') }}</option>
              <option value="reversal">{{ t('balance.ledgerTypes.reversal') }}</option>
            </select>
          </label>

          <label class="block">
            <span class="field-label">{{ t('balance.filters.dateFrom') }}</span>
            <input v-model="dateFrom" type="date" class="input-base text-sm" />
          </label>

          <label class="block">
            <span class="field-label">{{ t('balance.filters.dateTo') }}</span>
            <input v-model="dateTo" type="date" class="input-base text-sm" />
          </label>

          <div class="flex items-end gap-2 lg:col-span-2">
            <button type="submit" class="btn-primary" :disabled="balanceStore.isLoadingLedger">{{ t('common.apply') }}</button>
            <button type="button" class="btn-secondary" :disabled="balanceStore.isLoadingLedger" @click="clearFilters">
              {{ t('common.clear') }}
            </button>
          </div>
        </form>

        <div v-if="balanceStore.ledgerError" class="alert-error flex items-center justify-between gap-3">
          <div>
            <p class="font-medium">{{ t('balance.sections.ledgerError') }}</p>
            <p class="mt-0.5 text-xs text-rose-700/90 dark:text-rose-300">{{ balanceStore.ledgerError }}</p>
          </div>
          <button type="button" class="btn-secondary" @click="applyFilters(currentPage).catch(() => undefined)">
            {{ t('common.retry') }}
          </button>
        </div>

        <div v-if="hasInitialLoading" class="space-y-3">
          <div class="skeleton h-10 w-full"></div>
          <div class="skeleton h-10 w-full"></div>
          <div class="skeleton h-10 w-full"></div>
        </div>

        <AppEmptyState v-else-if="ledger.items.length === 0" :title="ledgerEmptyTitle" :description="ledgerEmptyDescription" />

        <div v-else class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('balance.table.date') }}</th>
                <th>{{ t('balance.table.type') }}</th>
                <th>{{ t('balance.table.amount') }}</th>
                <th>{{ t('balance.table.newBalance') }}</th>
                <th>{{ t('balance.table.relatedTransaction') }}</th>
                <th>{{ t('balance.table.description') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in ledger.items" :key="entry.id">
                <td>{{ formatDateTime(entry.createdAt) }}</td>
                <td>
                  <span class="status-chip">
                    {{ getLedgerTypeLabel(entry.type) }}
                  </span>
                </td>
                <td class="font-semibold" :class="getAmountClasses(entry.amountCents)">
                  {{ formatCurrency(entry.amount) }}
                </td>
                <td class="font-medium text-slate-800 dark:text-slate-100">
                  {{ formatCurrency(entry.newBalance) }}
                </td>
                <td class="text-xs">
                  <NuxtLink
                    v-if="entry.transactionId"
                    :to="`/transactions?search=${entry.transactionId}`"
                    class="font-mono text-brand-700 hover:text-brand-600 dark:text-brand-300 dark:hover:text-brand-200"
                  >
                    {{ entry.transactionId }}
                  </NuxtLink>
                  <span v-else>-</span>
                </td>
                <td class="text-xs">{{ entry.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ t('common.pageOf', { page: currentPage, total: Math.max(1, totalPages) }) }}
          </p>
          <div class="flex items-center gap-2">
            <button type="button" class="btn-secondary" :disabled="currentPage <= 1 || balanceStore.isLoadingLedger" @click="goToPreviousPage">
              {{ t('common.previous') }}
            </button>
            <button type="button" class="btn-secondary" :disabled="currentPage >= totalPages || balanceStore.isLoadingLedger" @click="goToNextPage">
              {{ t('common.next') }}
            </button>
          </div>
        </footer>
      </div>
    </section>
  </section>
</template>
