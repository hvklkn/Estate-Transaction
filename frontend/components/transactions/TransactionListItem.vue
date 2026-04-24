<script setup lang="ts">
import { computed, ref } from 'vue';

import TransactionCompactFinancialSummary from '~/components/transactions/TransactionCompactFinancialSummary.vue';
import TransactionDetailPanel from '~/components/transactions/TransactionDetailPanel.vue';
import TransactionStageBadge from '~/components/transactions/TransactionStageBadge.vue';
import { useAppI18n } from '~/composables/useAppI18n';
import type { Transaction, TransactionStage } from '~/types/transaction';

const props = defineProps<{
  transaction: Transaction;
  nextStage: TransactionStage | null;
  isUpdatingStage: boolean;
  isUpdatingTransaction?: boolean;
  isDeletingTransaction?: boolean;
  canViewDeletedMetadata?: boolean;
  compactMode?: boolean;
}>();

const emit = defineEmits<{
  'stage-change': [payload: { id: string; stage: TransactionStage }];
  view: [id: string];
  edit: [id: string];
  delete: [id: string];
}>();

const { t, formatCurrency, formatDateTime, getStageLabel } = useAppI18n();
const isDetailsVisible = ref(false);
const listingAgentName = computed(
  () => props.transaction.listingAgent?.name?.trim() || 'Unknown Agent'
);
const sellingAgentName = computed(
  () => props.transaction.sellingAgent?.name?.trim() || 'Unknown Agent'
);
const createdByLabel = computed(
  () => props.transaction.createdBy?.name?.trim() || props.transaction.createdById || 'Unknown'
);
const updatedByLabel = computed(
  () => props.transaction.updatedBy?.name?.trim() || props.transaction.updatedById || null
);
const deletedByLabel = computed(
  () => props.transaction.deletedBy?.name?.trim() || props.transaction.deletedById || null
);
const canAdvanceStage = computed(() => Boolean(props.nextStage) && !props.transaction.isDeleted);
const canEditTransaction = computed(
  () => !props.transaction.isDeleted && !props.isUpdatingTransaction && !props.isDeletingTransaction
);
const canDeleteTransaction = computed(
  () => !props.transaction.isDeleted && !props.isUpdatingTransaction && !props.isDeletingTransaction
);

const onAdvanceStage = () => {
  if (!props.nextStage || !canAdvanceStage.value) {
    return;
  }

  emit('stage-change', {
    id: props.transaction.id,
    stage: props.nextStage
  });
};

const onToggleDetails = () => {
  isDetailsVisible.value = !isDetailsVisible.value;
  emit('view', props.transaction.id);
};

const onEdit = () => {
  emit('edit', props.transaction.id);
};

const onDelete = () => {
  emit('delete', props.transaction.id);
};
</script>

<template>
  <article
    class="rounded-2xl border bg-white shadow-sm transition-colors dark:bg-slate-900"
    :class="
      props.transaction.isDeleted
        ? 'border-slate-300/80 bg-slate-100/70 opacity-90 dark:border-slate-700 dark:bg-slate-900/70'
        : !props.nextStage
        ? 'border-emerald-300/70 bg-emerald-50/30 hover:border-emerald-400/70 dark:border-emerald-700/60 dark:bg-emerald-950/20'
        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
    "
  >
    <div :class="props.compactMode ? 'space-y-3 p-4 sm:p-5' : 'space-y-4 p-5 sm:p-6'">
      <header class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-1.5">
          <h4 :class="props.compactMode ? 'text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100' : 'text-xl font-semibold leading-tight text-slate-900 dark:text-slate-100'">
            {{ props.transaction.propertyTitle }}
          </h4>
          <p class="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            {{ t('transactions.item.transactionId') }}: {{ props.transaction.id }}
          </p>
        </div>

        <div class="flex flex-col items-end gap-2">
          <TransactionStageBadge :stage="props.transaction.stage" />
          <span
            v-if="props.transaction.isDeleted"
            class="rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-rose-700 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
          >
            Deleted
          </span>
          <span
            v-if="!props.nextStage && !props.transaction.isDeleted"
            class="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
          >
            Workflow closed
          </span>
          <span
            v-if="!props.nextStage && !props.transaction.isDeleted"
            class="rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em]"
            :class="
              props.transaction.balanceDistributionApplied
                ? 'border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
            "
          >
            {{
              props.transaction.balanceDistributionApplied
                ? 'Balance credited'
                : 'Balance pending'
            }}
          </span>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ t('transactions.item.lastUpdated') }}: {{ formatDateTime(props.transaction.updatedAt) }}
          </p>
        </div>
      </header>

      <section :class="props.compactMode ? 'grid gap-2 lg:grid-cols-[1.25fr_1fr_1fr]' : 'grid gap-3 lg:grid-cols-[1.25fr_1fr_1fr]'">
        <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {{ t('transactions.item.totalServiceFee') }}
          </p>
          <p class="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {{ formatCurrency(props.transaction.totalServiceFee) }}
          </p>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-800">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {{ t('transactions.item.listingAgent') }}
          </p>
          <p class="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
            {{ listingAgentName }}
          </p>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-800">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {{ t('transactions.item.sellingAgent') }}
          </p>
          <p class="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
            {{ sellingAgentName }}
          </p>
        </div>
      </section>

      <TransactionCompactFinancialSummary
        :financial-breakdown="props.transaction.financialBreakdown"
        :total-service-fee="props.transaction.totalServiceFee"
      />

      <section class="grid gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
        <p><span class="font-semibold text-slate-700 dark:text-slate-200">Created by:</span> {{ createdByLabel }}</p>
        <p><span class="font-semibold text-slate-700 dark:text-slate-200">Last edited by:</span> {{ updatedByLabel ?? 'Not available' }}</p>
        <p><span class="font-semibold text-slate-700 dark:text-slate-200">Last edited at:</span> {{ formatDateTime(props.transaction.updatedAt) }}</p>
        <template v-if="props.transaction.isDeleted && props.canViewDeletedMetadata">
          <p><span class="font-semibold text-slate-700 dark:text-slate-200">Deleted by:</span> {{ deletedByLabel ?? 'Unknown' }}</p>
          <p><span class="font-semibold text-slate-700 dark:text-slate-200">Deleted at:</span> {{ formatDateTime(props.transaction.deletedAt ?? undefined) }}</p>
        </template>
      </section>

      <section
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/80"
      >
        <div>
          <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ t('transactions.item.stageAction') }}</p>
          <p v-if="canAdvanceStage && props.nextStage" class="text-xs text-slate-500 dark:text-slate-400">
            {{
              t('transactions.item.nextAllowedStage', {
                stage: getStageLabel(props.nextStage)
              })
            }}
          </p>
          <p
            v-else-if="props.transaction.isDeleted"
            class="text-xs text-slate-500 dark:text-slate-400"
          >
            Deleted transactions are read-only for audit traceability.
          </p>
          <p v-else class="text-xs text-slate-500 dark:text-slate-400">{{ t('transactions.item.noFurtherAction') }}</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="btn-secondary"
            :disabled="Boolean(props.isUpdatingTransaction || props.isDeletingTransaction)"
            @click="onToggleDetails"
          >
            {{ isDetailsVisible ? t('transactions.item.hideDetails') : t('transactions.item.viewDetails') }}
          </button>

          <button
            type="button"
            class="btn-secondary"
            :disabled="!canEditTransaction"
            @click="onEdit"
          >
            <template v-if="props.isUpdatingTransaction">Editing...</template>
            <template v-else>Edit</template>
          </button>

          <button
            type="button"
            class="btn-secondary border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/40"
            :disabled="!canDeleteTransaction"
            @click="onDelete"
          >
            <template v-if="props.isDeletingTransaction">Deleting...</template>
            <template v-else>Delete</template>
          </button>

          <button
            :class="canAdvanceStage ? 'btn-primary' : 'btn-secondary'"
            :disabled="!canAdvanceStage || props.isUpdatingStage"
            @click="onAdvanceStage"
          >
            <template v-if="props.isUpdatingStage">{{ t('transactions.item.updating') }}</template>
            <template v-else-if="canAdvanceStage && props.nextStage">
              {{ `Move to ${getStageLabel(props.nextStage)}` }}
            </template>
            <template v-else>{{ t('transactions.item.completed') }}</template>
          </button>
        </div>
      </section>

      <TransactionDetailPanel
        v-if="isDetailsVisible"
        :transaction="props.transaction"
        :can-view-deleted-metadata="props.canViewDeletedMetadata"
      />
    </div>
  </article>
</template>
