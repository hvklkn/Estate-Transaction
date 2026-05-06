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
const { formatCurrency, formatDateTime } = useAppI18n();

useHead(() => ({
  title: 'My Balance'
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
  hasLedgerFilters.value ? 'No ledger rows match your filters' : 'No balance movements yet'
);
const ledgerEmptyDescription = computed(() =>
  hasLedgerFilters.value
    ? 'Try clearing type/date filters to see a wider result set.'
    : 'Your commission credits and adjustments will appear here once activity starts.'
);

const getLedgerTypeLabel = (type: BalanceLedgerType): string => {
  switch (type) {
    case 'commission_credit':
      return 'Commission Credit';
    case 'manual_adjustment':
      return 'Manual Adjustment';
    case 'reversal':
      return 'Reversal';
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
      eyebrow="Balance Center"
      title="My Balance"
      description="Track your commission credits, audit trail entries, and balance timeline."
      :meta="`Showing ${showingRange} of ${ledger.total} ledger entries`"
    >
      <template #actions>
        <button
          type="button"
          class="btn-secondary"
          :disabled="balanceStore.isLoadingSummary || balanceStore.isLoadingLedger"
          @click="refreshPage"
        >
          {{ balanceStore.isLoadingSummary || balanceStore.isLoadingLedger ? 'Refreshing...' : 'Refresh' }}
        </button>
      </template>
    </AppPageHeader>

    <div class="grid gap-4 md:grid-cols-3">
      <article class="panel">
        <div class="panel-body">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Current Balance</p>
          <p class="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
            {{ summary ? formatCurrency(summary.balance) : '$0.00' }}
          </p>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Available commission balance</p>
        </div>
      </article>

      <article class="panel">
        <div class="panel-body">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Total Earned</p>
          <p class="mt-2 text-3xl font-semibold text-emerald-700 dark:text-emerald-300">
            {{ summary ? formatCurrency(summary.totalEarned) : '$0.00' }}
          </p>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Commission credit total</p>
        </div>
      </article>

      <article class="panel">
        <div class="panel-body">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Recent Movements</p>
          <p class="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
            {{ summary?.recentLedgerEntries.length ?? 0 }}
          </p>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Last 8 rows from ledger</p>
        </div>
      </article>
    </div>

    <article class="panel">
      <div class="panel-body space-y-5">
        <AppSectionHeader title="Sales Records" description="Transactions where you are assigned as the selling agent are listed here.">
          <template #actions>
            <div class="flex flex-wrap gap-2">
              <span class="status-chip">Total Sales: {{ mySales.length }}</span>
              <span class="status-chip">Completed: {{ completedSalesCount }}</span>
              <span class="status-chip">Volume: {{ formatCurrency(totalSalesVolume) }}</span>
              <span class="status-chip">Earnings: {{ formatCurrency(totalSalesEarnings) }}</span>
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
          title="No sales found"
          description="Your assigned sales transactions will appear here."
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
                  Transaction ID: {{ transaction.id }}
                </p>
              </div>
              <TransactionStageBadge :stage="transaction.stage" />
            </div>

            <div class="mt-3 grid gap-3 sm:grid-cols-3">
              <div class="surface-muted px-3 py-2">
                <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Service Fee</p>
                <p class="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{{ formatCurrency(transaction.totalServiceFee) }}</p>
              </div>

              <div class="surface-muted px-3 py-2">
                <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Your Earning</p>
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
                <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Created At</p>
                <p class="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{{ formatDateTime(transaction.createdAt) }}</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </article>

    <div v-if="balanceStore.summaryError" class="alert-error flex items-center justify-between gap-3">
      <div>
        <p class="font-medium">Could not load balance summary</p>
        <p class="mt-0.5 text-xs text-rose-700/90 dark:text-rose-300">{{ balanceStore.summaryError }}</p>
      </div>
      <button type="button" class="btn-secondary" @click="balanceStore.fetchSummary().catch(() => undefined)">
        Retry
      </button>
    </div>

    <section class="panel">
      <div class="panel-body space-y-4">
        <AppSectionHeader title="Ledger History" :description="`Showing ${showingRange} of ${ledger.total} entries`">
          <template #actions>
            <NuxtLink to="/transactions" class="btn-secondary">Back to Transactions</NuxtLink>
          </template>
        </AppSectionHeader>

        <form class="grid gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40 lg:grid-cols-5" @submit.prevent="applyFilters(1)">
          <label class="block">
            <span class="field-label">Type</span>
            <select v-model="typeFilter" class="input-base text-sm">
              <option value="all">All</option>
              <option value="commission_credit">Commission Credit</option>
              <option value="manual_adjustment">Manual Adjustment</option>
              <option value="reversal">Reversal</option>
            </select>
          </label>

          <label class="block">
            <span class="field-label">Date From</span>
            <input v-model="dateFrom" type="date" class="input-base text-sm" />
          </label>

          <label class="block">
            <span class="field-label">Date To</span>
            <input v-model="dateTo" type="date" class="input-base text-sm" />
          </label>

          <div class="flex items-end gap-2 lg:col-span-2">
            <button type="submit" class="btn-primary" :disabled="balanceStore.isLoadingLedger">Apply</button>
            <button type="button" class="btn-secondary" :disabled="balanceStore.isLoadingLedger" @click="clearFilters">
              Clear
            </button>
          </div>
        </form>

        <div v-if="balanceStore.ledgerError" class="alert-error flex items-center justify-between gap-3">
          <div>
            <p class="font-medium">Could not load ledger entries</p>
            <p class="mt-0.5 text-xs text-rose-700/90 dark:text-rose-300">{{ balanceStore.ledgerError }}</p>
          </div>
          <button type="button" class="btn-secondary" @click="applyFilters(currentPage).catch(() => undefined)">
            Retry
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
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>New Balance</th>
                <th>Related Transaction</th>
                <th>Description</th>
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
            Page {{ currentPage }} of {{ Math.max(1, totalPages) }}
          </p>
          <div class="flex items-center gap-2">
            <button type="button" class="btn-secondary" :disabled="currentPage <= 1 || balanceStore.isLoadingLedger" @click="goToPreviousPage">
              Previous
            </button>
            <button type="button" class="btn-secondary" :disabled="currentPage >= totalPages || balanceStore.isLoadingLedger" @click="goToNextPage">
              Next
            </button>
          </div>
        </footer>
      </div>
    </section>
  </section>
</template>
