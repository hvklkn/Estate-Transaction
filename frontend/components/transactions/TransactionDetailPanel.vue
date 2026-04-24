<script setup lang="ts">
import { computed } from 'vue';

import TransactionFinancialBreakdown from '~/components/transactions/TransactionFinancialBreakdown.vue';
import TransactionStageBadge from '~/components/transactions/TransactionStageBadge.vue';
import { useAppI18n } from '~/composables/useAppI18n';
import { TransactionStage, TransactionType, type Transaction } from '~/types/transaction';

const props = defineProps<{
  transaction: Transaction;
  canViewDeletedMetadata?: boolean;
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
const updatedByName = computed(
  () => props.transaction.updatedBy?.name?.trim() || props.transaction.updatedById || null
);
const deletedByName = computed(
  () => props.transaction.deletedBy?.name?.trim() || props.transaction.deletedById || null
);
const transactionTypeLabel = computed(() =>
  props.transaction.transactionType === TransactionType.RENTED ? 'Rented' : 'Sold'
);
const isCompleted = computed(() => props.transaction.stage === TransactionStage.COMPLETED);
const creditedAgentAllocations = computed(() =>
  props.transaction.balanceDistributionApplied ? props.transaction.financialBreakdown.agents : []
);
const creditedByLabel = computed(() => {
  if (!props.transaction.balanceDistributionAppliedById) {
    return null;
  }

  if (props.transaction.balanceDistributionAppliedById === props.transaction.listingAgentId) {
    return `${listingAgentName.value} (listing role)`;
  }

  if (props.transaction.balanceDistributionAppliedById === props.transaction.sellingAgentId) {
    return `${sellingAgentName.value} (selling role)`;
  }

  return props.transaction.balanceDistributionAppliedById;
});
const resolveAllocationAgentName = (agentId: string) => {
  if (agentId === props.transaction.listingAgentId && agentId === props.transaction.sellingAgentId) {
    return listingAgentName.value;
  }

  if (agentId === props.transaction.listingAgentId) {
    return listingAgentName.value;
  }

  if (agentId === props.transaction.sellingAgentId) {
    return sellingAgentName.value;
  }

  return 'Unknown Agent';
};
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
        <dt class="mb-1 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
          Listing role
        </dt>
        <dt class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {{ t('transactions.detail.listingAgent') }}
        </dt>
        <dd class="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
          {{ listingAgentName }}
        </dd>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900">
        <dt class="mb-1 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
          Selling role
        </dt>
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
          Last Edited By
        </dt>
        <dd class="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
          {{ updatedByName ?? 'Not available' }}
        </dd>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900">
        <dt class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Last Edited At
        </dt>
        <dd class="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
          {{ formatDateTime(props.transaction.updatedAt) }}
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

      <div
        v-if="props.transaction.isDeleted && props.canViewDeletedMetadata"
        class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 dark:border-rose-700 dark:bg-rose-950/30"
      >
        <dt class="text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-700 dark:text-rose-300">
          Deleted By
        </dt>
        <dd class="mt-1 text-sm font-medium text-rose-800 dark:text-rose-200">
          {{ deletedByName ?? 'Unknown' }}
        </dd>
      </div>

      <div
        v-if="props.transaction.isDeleted && props.canViewDeletedMetadata"
        class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 dark:border-rose-700 dark:bg-rose-950/30"
      >
        <dt class="text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-700 dark:text-rose-300">
          Deleted At
        </dt>
        <dd class="mt-1 text-sm font-medium text-rose-800 dark:text-rose-200">
          {{ formatDateTime(props.transaction.deletedAt ?? undefined) }}
        </dd>
      </div>
    </dl>

    <section v-if="isCompleted" class="space-y-2">
      <h5 class="text-sm font-semibold text-slate-800 dark:text-slate-200">Balance Distribution</h5>

      <div
        v-if="props.transaction.balanceDistributionApplied"
        class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-700 dark:bg-emerald-950/30"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            Commission credited to agent balances
          </p>
          <p v-if="props.transaction.balanceDistributionAppliedAt" class="text-xs text-emerald-700 dark:text-emerald-300">
            {{ formatDateTime(props.transaction.balanceDistributionAppliedAt) }}
          </p>
        </div>
        <p v-if="creditedByLabel" class="mt-1 text-xs text-emerald-700/90 dark:text-emerald-300/90">
          Credited by: {{ creditedByLabel }}
        </p>

        <ul class="mt-3 space-y-2">
          <li
            v-for="agentAllocation in creditedAgentAllocations"
            :key="`${agentAllocation.agentId}-${agentAllocation.role}`"
            class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm dark:border-emerald-800 dark:bg-slate-900"
          >
            <div>
              <p class="font-medium text-slate-800 dark:text-slate-200">
                {{ resolveAllocationAgentName(agentAllocation.agentId) }}
              </p>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ t(`transactions.financial.roles.${agentAllocation.role}`) }}
              </p>
            </div>
            <p class="font-semibold text-emerald-700 dark:text-emerald-300">
              {{ formatCurrency(agentAllocation.amount) }}
            </p>
          </li>
        </ul>
      </div>

      <p
        v-else
        class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
      >
        Transaction is completed but balance distribution is pending.
      </p>
    </section>

    <section class="space-y-2">
      <h5 class="text-sm font-semibold text-slate-800 dark:text-slate-200">
        {{ t('transactions.history.title') }}
      </h5>

      <ol
        v-if="props.transaction.stageHistory.length > 0"
        class="space-y-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
      >
        <li
          v-for="(entry, index) in props.transaction.stageHistory"
          :key="`${entry.toStage}-${entry.changedAt}-${index}`"
          class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/70"
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
