<script setup lang="ts">
import TransactionListItem from '~/components/transactions/TransactionListItem.vue';
import { useAppI18n } from '~/composables/useAppI18n';
import type { Transaction, TransactionStage } from '~/types/transaction';

const props = defineProps<{
  transactions: Transaction[];
  stageUpdateTransactionId: string | null;
  updateTransactionId?: string | null;
  deleteTransactionId?: string | null;
  getNextStage: (stage: TransactionStage) => TransactionStage | null;
  canViewDeletedMetadata?: boolean;
  isRefreshing?: boolean;
  compactMode?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}>();

const emit = defineEmits<{
  'stage-change': [payload: { id: string; stage: TransactionStage }];
  view: [id: string];
  edit: [id: string];
  delete: [id: string];
}>();

const { t } = useAppI18n();
</script>

<template>
  <section class="panel">
    <div class="panel-body space-y-5">
      <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
        <div>
          <h3 class="text-xl font-semibold text-slate-900 dark:text-slate-100">{{ t('transactions.list.title') }}</h3>
          <p class="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {{ t('transactions.list.description') }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="status-chip">
            {{ t('transactions.list.recordCount', { count: props.transactions.length }) }}
          </span>
          <span v-if="props.isRefreshing" class="text-xs font-medium text-slate-500 dark:text-slate-400">
            {{ t('transactions.actions.refreshing') }}
          </span>
        </div>
      </header>

      <div v-if="props.transactions.length === 0" class="empty-state">
        <div class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
          <svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M4.25 3.5A2.25 2.25 0 002 5.75v8.5A2.25 2.25 0 004.25 16.5h11.5A2.25 2.25 0 0018 14.25v-8.5A2.25 2.25 0 0015.75 3.5H4.25zm.53 3.72a.75.75 0 011.06 0L10 11.38l4.16-4.16a.75.75 0 111.06 1.06l-4.69 4.69a.75.75 0 01-1.06 0L4.78 8.28a.75.75 0 010-1.06z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <h4 class="text-base font-semibold text-slate-800 dark:text-slate-100">
          {{ props.emptyTitle ?? t('transactions.list.emptyTitle') }}
        </h4>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
          {{ props.emptyDescription ?? t('transactions.list.emptyDescription') }}
        </p>
      </div>

      <div v-else :class="props.compactMode ? 'space-y-3' : 'space-y-4'">
        <TransactionListItem
          v-for="transaction in props.transactions"
          :key="transaction.id"
          :transaction="transaction"
          :next-stage="props.getNextStage(transaction.stage)"
          :is-updating-stage="props.stageUpdateTransactionId === transaction.id"
          :is-updating-transaction="props.updateTransactionId === transaction.id"
          :is-deleting-transaction="props.deleteTransactionId === transaction.id"
          :can-view-deleted-metadata="props.canViewDeletedMetadata"
          :compact-mode="props.compactMode"
          @stage-change="emit('stage-change', $event)"
          @view="emit('view', $event)"
          @edit="emit('edit', $event)"
          @delete="emit('delete', $event)"
        />
      </div>
    </div>
  </section>
</template>
