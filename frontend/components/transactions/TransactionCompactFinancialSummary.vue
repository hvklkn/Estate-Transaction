<script setup lang="ts">
import { computed } from 'vue';

import { useAppI18n } from '~/composables/useAppI18n';
import type { FinancialBreakdown } from '~/types/transaction';

const props = defineProps<{
  financialBreakdown: FinancialBreakdown;
  totalServiceFee: number;
}>();

const { t, formatCurrency } = useAppI18n();

const agentAllocationCount = computed(() => props.financialBreakdown.agents.length);
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
    <div class="mb-2 flex items-center justify-between gap-3">
      <h5 class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {{ t('transactions.financial.title') }}
      </h5>
      <p class="text-xs text-slate-500">
        {{ t('transactions.financial.total') }}: {{ formatCurrency(props.totalServiceFee) }}
      </p>
    </div>

    <div class="grid gap-2 sm:grid-cols-2">
      <div class="rounded-lg border border-brand-200 bg-white px-3 py-2.5">
        <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {{ t('transactions.financial.agencyAmount') }}
        </p>
        <p class="mt-1 text-base font-semibold text-slate-900">
          {{ formatCurrency(props.financialBreakdown.agencyAmount) }}
        </p>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
        <div class="flex items-center justify-between gap-2">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {{ t('transactions.financial.agentPool') }}
          </p>
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {{ t('transactions.item.agentsCount', { count: agentAllocationCount }) }}
          </span>
        </div>
        <p class="mt-1 text-base font-semibold text-slate-900">
          {{ formatCurrency(props.financialBreakdown.agentPoolAmount) }}
        </p>
      </div>
    </div>
  </section>
</template>
