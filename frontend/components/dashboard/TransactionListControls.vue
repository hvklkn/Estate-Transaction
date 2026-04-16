<script setup lang="ts">
import { useAppI18n } from '~/composables/useAppI18n';
import { TransactionStage } from '~/types/transaction';

export type TransactionSortOption = 'newest' | 'oldest' | 'highest_commission';

const props = defineProps<{
  searchQuery: string;
  stageFilter: TransactionStage | 'all';
  sortBy: TransactionSortOption;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:search-query': [value: string];
  'update:stage-filter': [value: TransactionStage | 'all'];
  'update:sort-by': [value: TransactionSortOption];
}>();

const { t, getStageLabel } = useAppI18n();

const stageOptions: Array<{ value: TransactionStage | 'all'; label: string }> = [
  { value: 'all', label: t('transactions.filters.allStages') },
  { value: TransactionStage.AGREEMENT, label: getStageLabel(TransactionStage.AGREEMENT) },
  { value: TransactionStage.EARNEST_MONEY, label: getStageLabel(TransactionStage.EARNEST_MONEY) },
  { value: TransactionStage.TITLE_DEED, label: getStageLabel(TransactionStage.TITLE_DEED) },
  { value: TransactionStage.COMPLETED, label: getStageLabel(TransactionStage.COMPLETED) }
];

const sortOptions: Array<{ value: TransactionSortOption; label: string }> = [
  { value: 'newest', label: t('transactions.filters.sortNewest') },
  { value: 'oldest', label: t('transactions.filters.sortOldest') },
  {
    value: 'highest_commission',
    label: t('transactions.filters.sortHighestCommission')
  }
];
</script>

<template>
  <section class="panel">
    <div class="panel-body space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ t('transactions.filters.title') }}</h3>
      </div>

      <div class="grid gap-3 lg:grid-cols-[1.5fr,1fr,1fr]">
        <label class="block">
          <span class="field-label">{{ t('transactions.filters.searchLabel') }}</span>
          <input
            :value="props.searchQuery"
            type="search"
            class="input-base"
            :placeholder="t('transactions.filters.searchPlaceholder')"
            :disabled="props.disabled"
            @input="emit('update:search-query', ($event.target as HTMLInputElement).value)"
          />
        </label>

        <label class="block">
          <span class="field-label">{{ t('transactions.filters.stageLabel') }}</span>
          <select
            :value="props.stageFilter"
            class="input-base"
            :disabled="props.disabled"
            @change="
              emit(
                'update:stage-filter',
                ($event.target as HTMLSelectElement).value as TransactionStage | 'all'
              )
            "
          >
            <option
              v-for="option in stageOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>

        <label class="block">
          <span class="field-label">{{ t('transactions.filters.sortLabel') }}</span>
          <select
            :value="props.sortBy"
            class="input-base"
            :disabled="props.disabled"
            @change="
              emit(
                'update:sort-by',
                ($event.target as HTMLSelectElement).value as TransactionSortOption
              )
            "
          >
            <option
              v-for="option in sortOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>
      </div>
    </div>
  </section>
</template>
