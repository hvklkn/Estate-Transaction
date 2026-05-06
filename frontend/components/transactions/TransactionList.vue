<script setup lang="ts">
import TransactionListItem from '~/components/transactions/TransactionListItem.vue';
import { useAppI18n } from '~/composables/useAppI18n';
import type { AgentRole } from '~/types/agent';
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
  currentUserId?: string | null;
  currentUserRole?: AgentRole | null;
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
          <h3 class="text-xl font-semibold text-slate-950 dark:text-white">{{ t('transactions.list.title') }}</h3>
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

      <AppEmptyState
        v-if="props.transactions.length === 0"
        :title="props.emptyTitle ?? t('transactions.list.emptyTitle')"
        :description="props.emptyDescription ?? t('transactions.list.emptyDescription')"
      />

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
          :current-user-id="props.currentUserId"
          :current-user-role="props.currentUserRole"
          @stage-change="emit('stage-change', $event)"
          @view="emit('view', $event)"
          @edit="emit('edit', $event)"
          @delete="emit('delete', $event)"
        />
      </div>
    </div>
  </section>
</template>
