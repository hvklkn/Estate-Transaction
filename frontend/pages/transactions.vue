<script setup lang="ts">
import { computed, onMounted } from 'vue';

import MetricCard from '~/components/dashboard/MetricCard.vue';
import TransactionCreateForm from '~/components/transactions/TransactionCreateForm.vue';
import TransactionList from '~/components/transactions/TransactionList.vue';
import { useAppI18n } from '~/composables/useAppI18n';
import { useAuthStore } from '~/stores/auth';
import { useTransactionsStore } from '~/stores/transactions';
import type { CreateTransactionPayload, TransactionStage } from '~/types/transaction';

const transactionsStore = useTransactionsStore();
const authStore = useAuthStore();
const { t, formatCurrency } = useAppI18n();

useHead(() => ({
  title: t('transactions.meta.title')
}));

const hasTransactions = computed(() => transactionsStore.items.length > 0);
const isInitialLoading = computed(() => transactionsStore.isLoading && !hasTransactions.value);
const isRefreshing = computed(() => transactionsStore.isLoading && hasTransactions.value);

const handleCreateTransaction = async (payload: CreateTransactionPayload) => {
  try {
    await transactionsStore.createTransaction(payload);
  } catch {
    // Errors are stored in Pinia state and rendered by the page.
  }
};

const handleStageChange = async (payload: { id: string; stage: TransactionStage }) => {
  try {
    await transactionsStore.updateTransactionStage(payload.id, payload.stage);
  } catch {
    // Errors are stored in Pinia state and rendered by the page.
  }
};

const handleRefresh = async () => {
  await transactionsStore.refreshTransactions();
};

onMounted(async () => {
  await transactionsStore.fetchTransactions();
  await authStore.fetchUsers().catch(() => undefined);
});
</script>

<template>
  <section class="space-y-8">
    <header
      class="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/50 p-6 shadow-sm sm:p-7"
    >
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
            {{ t('transactions.header.kicker') }}
          </p>
          <h1 class="text-3xl font-semibold sm:text-4xl">{{ t('transactions.header.title') }}</h1>
          <p class="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            {{ t('transactions.header.description') }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="status-chip">
            {{ t('transactions.list.recordCount', { count: transactionsStore.items.length }) }}
          </span>
          <button
            type="button"
            class="btn-secondary"
            :disabled="transactionsStore.isLoading"
            @click="handleRefresh"
          >
            {{ isRefreshing ? t('transactions.actions.refreshing') : t('transactions.actions.refresh') }}
          </button>
        </div>
      </div>
    </header>

    <div class="grid gap-4 lg:grid-cols-3">
      <MetricCard
        :label="t('transactions.metrics.openTransactions.label')"
        :value="String(transactionsStore.openTransactionsCount)"
        :helper="t('transactions.metrics.openTransactions.helper')"
      />
      <MetricCard
        :label="t('transactions.metrics.pendingClosings.label')"
        :value="String(transactionsStore.pendingClosingsCount)"
        :helper="t('transactions.metrics.pendingClosings.helper')"
      />
      <MetricCard
        :label="t('transactions.metrics.commissionPipeline.label')"
        :value="formatCurrency(transactionsStore.commissionPipelineAmount)"
        :helper="t('transactions.metrics.commissionPipeline.helper')"
        emphasis
      />
    </div>

    <div v-if="transactionsStore.error" class="alert-error flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="font-medium">{{ t('transactions.errors.syncTitle') }}</p>
        <p class="mt-0.5 text-xs text-rose-700/90">{{ transactionsStore.error }}</p>
      </div>
      <button
        type="button"
        class="btn-secondary border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
        @click="handleRefresh"
      >
        {{ t('transactions.actions.retry') }}
      </button>
    </div>

    <div v-if="isInitialLoading" class="grid gap-6 xl:grid-cols-[380px,minmax(0,1fr)]">
      <div class="panel">
        <div class="panel-body space-y-4">
          <div class="skeleton h-5 w-40"></div>
          <div class="skeleton h-4 w-full"></div>
          <div class="skeleton h-12 w-full"></div>
          <div class="skeleton h-10 w-full"></div>
          <div class="skeleton h-10 w-full"></div>
          <div class="skeleton h-10 w-full"></div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-body space-y-4">
          <div class="skeleton h-5 w-44"></div>
          <div class="skeleton h-40 w-full"></div>
          <div class="skeleton h-40 w-full"></div>
        </div>
      </div>
    </div>

    <div v-else class="grid gap-6 xl:grid-cols-[380px,minmax(0,1fr)] xl:items-start">
      <div class="xl:sticky xl:top-24">
        <TransactionCreateForm
          :is-submitting="transactionsStore.isCreating"
          :agents="authStore.activeUsers"
          :is-agents-loading="authStore.isLoadingUsers"
          @submit="handleCreateTransaction"
        />
      </div>

      <TransactionList
        :transactions="transactionsStore.items"
        :stage-update-transaction-id="transactionsStore.stageUpdateTransactionId"
        :get-next-stage="transactionsStore.getNextStage"
        :is-refreshing="isRefreshing"
        @stage-change="handleStageChange"
      />
    </div>
  </section>
</template>
