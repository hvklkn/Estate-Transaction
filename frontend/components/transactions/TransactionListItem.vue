<script setup lang="ts">
import TransactionFinancialBreakdown from '~/components/transactions/TransactionFinancialBreakdown.vue';
import TransactionStageBadge from '~/components/transactions/TransactionStageBadge.vue';
import { useAppI18n } from '~/composables/useAppI18n';
import type { Transaction, TransactionStage } from '~/types/transaction';

const props = defineProps<{
  transaction: Transaction;
  nextStage: TransactionStage | null;
  isUpdatingStage: boolean;
}>();

const emit = defineEmits<{
  'stage-change': [payload: { id: string; stage: TransactionStage }];
}>();
const { t, formatCurrency, formatDateTime, getStageLabel } = useAppI18n();

const onAdvanceStage = () => {
  if (!props.nextStage) {
    return;
  }

  emit('stage-change', {
    id: props.transaction.id,
    stage: props.nextStage
  });
};
</script>

<template>
  <article class="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div class="space-y-5 p-5 sm:p-6">
      <div class="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div class="space-y-1">
          <h4 class="text-xl font-semibold text-slate-900">{{ props.transaction.propertyTitle }}</h4>
          <p class="mt-1 font-mono text-[11px] text-slate-500">
            {{ t('transactions.item.transactionId') }}: {{ props.transaction.id }}
          </p>
        </div>
        <div class="space-y-2 text-right">
          <TransactionStageBadge :stage="props.transaction.stage" />
          <p class="text-xs text-slate-500">
            {{ t('transactions.item.lastUpdated') }}: {{ formatDateTime(props.transaction.updatedAt) }}
          </p>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-3">
        <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {{ t('transactions.item.totalServiceFee') }}
          </p>
          <p class="mt-1 text-lg font-semibold text-slate-900">
            {{ formatCurrency(props.transaction.totalServiceFee) }}
          </p>
        </div>

        <div class="rounded-lg border border-brand-200 bg-brand-50/70 px-3 py-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {{ t('transactions.financial.agencyAmount') }}
          </p>
          <p class="mt-1 text-lg font-semibold text-slate-900">
            {{ formatCurrency(props.transaction.financialBreakdown.agencyAmount) }}
          </p>
        </div>

        <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {{ t('transactions.financial.agentPool') }}
          </p>
          <p class="mt-1 text-lg font-semibold text-slate-900">
            {{ formatCurrency(props.transaction.financialBreakdown.agentPoolAmount) }}
          </p>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <div class="rounded-lg border border-slate-200 bg-white px-3 py-3">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {{ t('transactions.item.listingAgent') }}
          </p>
          <p class="mt-1 text-sm font-medium text-slate-800">
            {{ props.transaction.listingAgent?.name ?? props.transaction.listingAgentId }}
          </p>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white px-3 py-3">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {{ t('transactions.item.sellingAgent') }}
          </p>
          <p class="mt-1 text-sm font-medium text-slate-800">
            {{ props.transaction.sellingAgent?.name ?? props.transaction.sellingAgentId }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3">
        <div>
          <p class="text-sm font-medium text-slate-800">{{ t('transactions.item.stageAction') }}</p>
          <p v-if="props.nextStage" class="text-xs text-slate-500">
            {{
              t('transactions.item.nextAllowedStage', {
                stage: getStageLabel(props.nextStage)
              })
            }}
          </p>
          <p v-else class="text-xs text-slate-500">{{ t('transactions.item.noFurtherAction') }}</p>
        </div>

        <button
          :class="props.nextStage ? 'btn-primary' : 'btn-secondary'"
          :disabled="!props.nextStage || props.isUpdatingStage"
          @click="onAdvanceStage"
        >
          <template v-if="props.isUpdatingStage">{{ t('transactions.item.updating') }}</template>
          <template v-else-if="props.nextStage">
            {{ t('transactions.item.advanceTo', { stage: getStageLabel(props.nextStage) }) }}
          </template>
          <template v-else>{{ t('transactions.item.completed') }}</template>
        </button>
      </div>

      <TransactionFinancialBreakdown
        :financial-breakdown="props.transaction.financialBreakdown"
        :total-service-fee="props.transaction.totalServiceFee"
      />
    </div>
  </article>
</template>
