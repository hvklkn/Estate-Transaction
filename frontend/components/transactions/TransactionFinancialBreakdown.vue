<script setup lang="ts">
import { computed } from 'vue';

import { useAppI18n } from '~/composables/useAppI18n';
import type { FinancialBreakdown } from '~/types/transaction';

const props = defineProps<{
  financialBreakdown: FinancialBreakdown;
  totalServiceFee?: number;
}>();
const { t, formatCurrency, formatPercent } = useAppI18n();

const agencyPercent = computed(() => {
  if (!props.totalServiceFee || props.totalServiceFee <= 0) {
    return 0;
  }

  return (props.financialBreakdown.agencyAmount / props.totalServiceFee) * 100;
});

const agentPoolPercent = computed(() => {
  if (!props.totalServiceFee || props.totalServiceFee <= 0) {
    return 0;
  }

  return (props.financialBreakdown.agentPoolAmount / props.totalServiceFee) * 100;
});
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
    <div class="flex items-start justify-between gap-3">
      <h5 class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ t('transactions.financial.title') }}</h5>
      <p v-if="props.totalServiceFee" class="text-xs text-slate-500 dark:text-slate-400">
        {{ t('transactions.financial.total') }}: {{ formatCurrency(props.totalServiceFee) }}
      </p>
    </div>

    <dl class="mt-3 grid gap-3 md:grid-cols-2">
      <div class="rounded-lg border border-brand-200 bg-white px-3 py-3 dark:border-brand-700/70 dark:bg-slate-900">
        <dt class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {{ t('transactions.financial.agencyAmount') }}
        </dt>
        <dd class="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
          {{ formatCurrency(props.financialBreakdown.agencyAmount) }}
        </dd>
        <p v-if="props.totalServiceFee" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {{ t('transactions.financial.ofTotalFee', { percent: formatPercent(agencyPercent) }) }}
        </p>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900">
        <dt class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {{ t('transactions.financial.agentPool') }}
        </dt>
        <dd class="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
          {{ formatCurrency(props.financialBreakdown.agentPoolAmount) }}
        </dd>
        <p v-if="props.totalServiceFee" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {{ t('transactions.financial.ofTotalFee', { percent: formatPercent(agentPoolPercent) }) }}
        </p>
      </div>
    </dl>

    <div v-if="props.financialBreakdown.agents.length > 0" class="mt-3 space-y-2.5">
      <article
        v-for="agent in props.financialBreakdown.agents"
        :key="`${agent.agentId}-${agent.role}`"
        class="rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {{ t(`transactions.financial.roles.${agent.role}`) }}
            </p>
            <p class="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {{ t('transactions.financial.agentId') }}: {{ agent.agentId }}
            </p>
          </div>
          <p class="text-base font-semibold text-slate-900 dark:text-slate-100">{{ formatCurrency(agent.amount) }}</p>
        </div>
        <p class="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{{ agent.explanation }}</p>
      </article>
    </div>

    <p v-else class="mt-3 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
      {{ t('transactions.financial.noAllocations') }}
    </p>
  </section>
</template>
