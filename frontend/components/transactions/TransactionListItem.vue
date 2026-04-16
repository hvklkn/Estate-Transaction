<script setup lang="ts">
import { ref } from 'vue';

import TransactionCompactFinancialSummary from '~/components/transactions/TransactionCompactFinancialSummary.vue';
import TransactionDetailPanel from '~/components/transactions/TransactionDetailPanel.vue';
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
const isDetailsVisible = ref(false);

const onAdvanceStage = () => {
  if (!props.nextStage) {
    return;
  }

  emit('stage-change', {
    id: props.transaction.id,
    stage: props.nextStage
  });
};

const onToggleDetails = () => {
  isDetailsVisible.value = !isDetailsVisible.value;
};
</script>

<template>
  <article class="rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300">
    <div class="space-y-4 p-5 sm:p-6">
      <header class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-1.5">
          <h4 class="text-xl font-semibold leading-tight text-slate-900">
            {{ props.transaction.propertyTitle }}
          </h4>
          <p class="font-mono text-[11px] text-slate-500">
            {{ t('transactions.item.transactionId') }}: {{ props.transaction.id }}
          </p>
        </div>

        <div class="flex flex-col items-end gap-2">
          <TransactionStageBadge :stage="props.transaction.stage" />
          <p class="text-xs text-slate-500">
            {{ t('transactions.item.lastUpdated') }}: {{ formatDateTime(props.transaction.updatedAt) }}
          </p>
        </div>
      </header>

      <section class="grid gap-3 lg:grid-cols-[1.25fr_1fr_1fr]">
        <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {{ t('transactions.item.totalServiceFee') }}
          </p>
          <p class="mt-1 text-lg font-semibold text-slate-900">
            {{ formatCurrency(props.transaction.totalServiceFee) }}
          </p>
        </div>

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
      </section>

      <TransactionCompactFinancialSummary
        :financial-breakdown="props.transaction.financialBreakdown"
        :total-service-fee="props.transaction.totalServiceFee"
      />

      <section
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3"
      >
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

        <div class="flex flex-wrap items-center gap-2">
          <button type="button" class="btn-secondary" @click="onToggleDetails">
            {{
              isDetailsVisible
                ? t('transactions.item.hideDetails')
                : t('transactions.item.viewDetails')
            }}
          </button>

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
      </section>

      <TransactionDetailPanel
        v-if="isDetailsVisible"
        :transaction="props.transaction"
      />
    </div>
  </article>
</template>
