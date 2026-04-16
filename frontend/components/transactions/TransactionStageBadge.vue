<script setup lang="ts">
import { useAppI18n } from '~/composables/useAppI18n';
import { TransactionStage, type TransactionStage as TransactionStageType } from '~/types/transaction';

const props = defineProps<{
  stage: TransactionStageType;
}>();

const { getStageLabel } = useAppI18n();

const stageClassMap: Record<TransactionStageType, { chip: string; dot: string }> = {
  [TransactionStage.AGREEMENT]: {
    chip: 'border-slate-300 bg-slate-100 text-slate-700',
    dot: 'bg-slate-500'
  },
  [TransactionStage.EARNEST_MONEY]: {
    chip: 'border-amber-300 bg-amber-50 text-amber-800',
    dot: 'bg-amber-500'
  },
  [TransactionStage.TITLE_DEED]: {
    chip: 'border-blue-300 bg-blue-50 text-blue-800',
    dot: 'bg-blue-500'
  },
  [TransactionStage.COMPLETED]: {
    chip: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    dot: 'bg-emerald-500'
  }
};
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
    :class="stageClassMap[props.stage].chip"
  >
    <span class="h-1.5 w-1.5 rounded-full" :class="stageClassMap[props.stage].dot"></span>
    {{ getStageLabel(props.stage) }}
  </span>
</template>
