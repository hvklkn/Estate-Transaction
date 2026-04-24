<script setup lang="ts">
import { useAppI18n } from '~/composables/useAppI18n';
import { TransactionStage, TransactionType } from '~/types/transaction';

export type TransactionSortOption =
  | 'newest'
  | 'oldest'
  | 'recently_updated'
  | 'highest_fee'
  | 'lowest_fee'
  | 'property_a_to_z';

const props = defineProps<{
  searchQuery: string;
  stageFilter: TransactionStage | 'all';
  transactionTypeFilter: TransactionType | 'all';
  sortBy: TransactionSortOption;
  includeDeleted?: boolean;
  canIncludeDeleted?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:search-query': [value: string];
  'update:stage-filter': [value: TransactionStage | 'all'];
  'update:transaction-type-filter': [value: TransactionType | 'all'];
  'update:sort-by': [value: TransactionSortOption];
  'update:include-deleted': [value: boolean];
  clear: [];
}>();

const { t, getStageLabel } = useAppI18n();

const stageOptions: Array<{ value: TransactionStage | 'all'; label: string }> = [
  { value: 'all', label: t('transactions.filters.allStages') },
  { value: TransactionStage.AGREEMENT, label: getStageLabel(TransactionStage.AGREEMENT) },
  { value: TransactionStage.EARNEST_MONEY, label: getStageLabel(TransactionStage.EARNEST_MONEY) },
  { value: TransactionStage.TITLE_DEED, label: getStageLabel(TransactionStage.TITLE_DEED) },
  { value: TransactionStage.COMPLETED, label: getStageLabel(TransactionStage.COMPLETED) }
];

const transactionTypeOptions: Array<{ value: TransactionType | 'all'; label: string }> = [
  { value: 'all', label: 'All types' },
  { value: TransactionType.SOLD, label: 'Sold' },
  { value: TransactionType.RENTED, label: 'Rented' }
];

const sortOptions: Array<{ value: TransactionSortOption; label: string }> = [
  { value: 'newest', label: t('transactions.filters.sortNewest') },
  { value: 'oldest', label: t('transactions.filters.sortOldest') },
  { value: 'recently_updated', label: 'Recently updated' },
  { value: 'highest_fee', label: t('transactions.filters.sortHighestCommission') },
  { value: 'lowest_fee', label: 'Lowest commission' },
  { value: 'property_a_to_z', label: 'Property A-Z' }
];
</script>

<template>
  <section class="panel">
    <div class="panel-body space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {{ t('transactions.filters.title') }}
        </h3>
        <button
          type="button"
          class="btn-secondary px-3 py-1.5 text-xs"
          :disabled="props.disabled"
          @click="emit('clear')"
        >
          Clear filters
        </button>
      </div>

      <div
        class="grid gap-3"
        :class="
          props.canIncludeDeleted
            ? 'xl:grid-cols-[1.6fr,1fr,1fr,1fr,1fr]'
            : 'xl:grid-cols-[1.8fr,1fr,1fr,1fr]'
        "
      >
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
          <span class="field-label">Transaction Type</span>
          <select
            :value="props.transactionTypeFilter"
            class="input-base"
            :disabled="props.disabled"
            @change="
              emit(
                'update:transaction-type-filter',
                ($event.target as HTMLSelectElement).value as TransactionType | 'all'
              )
            "
          >
            <option
              v-for="option in transactionTypeOptions"
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

        <label
          v-if="props.canIncludeDeleted"
          class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
        >
          <input
            :checked="Boolean(props.includeDeleted)"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-200 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-brand-800"
            :disabled="props.disabled"
            @change="emit('update:include-deleted', ($event.target as HTMLInputElement).checked)"
          />
          <span class="text-sm font-medium text-slate-700 dark:text-slate-200">
            Include deleted
          </span>
        </label>
      </div>
    </div>
  </section>
</template>
