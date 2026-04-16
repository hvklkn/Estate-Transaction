<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  label: string;
  value: string;
  helper?: string;
  emphasis?: boolean;
}>(), {
  helper: undefined,
  emphasis: false
});

const rootClass = computed(() =>
  props.emphasis
    ? 'border-brand-200 bg-gradient-to-br from-brand-50 to-white shadow-[0_8px_30px_rgba(38,79,144,0.08)] dark:border-brand-700/60 dark:from-slate-900 dark:to-slate-800'
    : 'border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'
);
</script>

<template>
  <article class="min-w-0 rounded-2xl border p-5 transition-colors" :class="rootClass">
    <div class="space-y-2">
      <p
        class="text-[11px] font-semibold uppercase tracking-[0.14em]"
        :class="props.emphasis ? 'text-brand-700 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'"
      >
        {{ label }}
      </p>
      <p
        class="truncate text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-xl xl:text-2xl"
        :title="value"
      >
        {{ value }}
      </p>
      <p v-if="helper" class="text-xs leading-5 text-slate-500 dark:text-slate-400">{{ helper }}</p>
    </div>
  </article>
</template>
