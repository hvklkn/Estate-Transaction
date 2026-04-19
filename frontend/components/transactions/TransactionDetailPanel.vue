<script setup lang="ts">
import { computed } from 'vue';

import TransactionFinancialBreakdown from '~/components/transactions/TransactionFinancialBreakdown.vue';
import TransactionStageBadge from '~/components/transactions/TransactionStageBadge.vue';
import { useAppI18n } from '~/composables/useAppI18n';
import { TransactionType, type Transaction } from '~/types/transaction';

const props = defineProps<{
  transaction: Transaction;
}>();

const { t, formatCurrency, formatDateTime, getStageLabel } = useAppI18n();
const listingAgentName = computed(
  () => props.transaction.listingAgent?.name?.trim() || 'Unknown Agent'
);
const sellingAgentName = computed(
  () => props.transaction.sellingAgent?.name?.trim() || 'Unknown Agent'
);
const createdByName = computed(
  () => props.transaction.createdBy?.name?.trim() || null
);
const transactionTypeLabel = computed(() =>
  props.transaction.transactionType === TransactionType.RENTED ? 'Rented' : 'Sold'
);
</script>

<template>
  <section class="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {{ t('transactions.detail.currentStage') }}
        </p>
        <div class="mt-1">
          <TransactionStageBadge :stage="props.transaction.stage" />
        </div>
      </div>

      <div class="text-right">
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {{ t('transactions.detail.totalServiceFee') }}
        </p>
        <p class="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
          {{ formatCurrency(props.transaction.totalServiceFee) }}
        </p>
      </div>
    </header>

    <dl class="grid gap-3 md:grid-cols-3">
      <div class="rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900">
        <dt class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {{ t('transactions.detail.listingAgent') }}
        </dt>
        <dd class="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
          {{ listingAgentName }}
        </dd>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900">
        <dt class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {{ t('transactions.detail.sellingAgent') }}
        </dt>
        <dd class="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
          {{ sellingAgentName }}
        </dd>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900">
        <dt class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Created By
        </dt>
        <dd class="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
          {{ createdByName ?? 'Unknown' }}
        </dd>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900">
        <dt class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Transaction Type
        </dt>
        <dd class="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
          {{ transactionTypeLabel }}
        </dd>
      </div>
    </dl>

    <section class="space-y-2">
      <h5 class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ t('transactions.history.title') }}</h5>

      <ol v-if="props.transaction.stageHistory.length > 0" class="space-y-2">
        <li
          v-for="(entry, index) in props.transaction.stageHistory"
          :key="`${entry.toStage}-${entry.changedAt}-${index}`"
          class="rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">
              <template v-if="entry.fromStage">
                {{ getStageLabel(entry.fromStage) }} → {{ getStageLabel(entry.toStage) }}
              </template>
              <template v-else>
                {{ t('transactions.history.createdAtStage', { stage: getStageLabel(entry.toStage) }) }}
              </template>
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ formatDateTime(entry.changedAt) }}</p>
          </div>

          <p v-if="entry.changedBy?.name || entry.changedById" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {{ t('transactions.history.changedBy') }}:
            {{ entry.changedBy?.name ?? 'Unknown Agent' }}
          </p>
        </li>
      </ol>

      <p
        v-else
        class="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
      >
        {{ t('transactions.history.empty') }}
      </p>
    </section>

    <TransactionFinancialBreakdown
      :financial-breakdown="props.transaction.financialBreakdown"
      :total-service-fee="props.transaction.totalServiceFee"
      :listing-agent-name="listingAgentName"
      :selling-agent-name="sellingAgentName"
    />
  </section>
</template>
