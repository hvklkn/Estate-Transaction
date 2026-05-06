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
    ? 'border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white shadow-[0_14px_35px_rgba(37,99,235,0.12)] dark:border-blue-900 dark:from-blue-950/45 dark:via-slate-900 dark:to-slate-900'
    : 'border-slate-200 bg-white/95 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none'
);
</script>

<template>
  <article class="group min-w-0 rounded-[1.35rem] border p-5 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/10 dark:hover:shadow-none" :class="rootClass">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 space-y-2">
        <p
          class="text-[11px] font-semibold uppercase tracking-[0.14em]"
          :class="props.emphasis ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'"
        >
          {{ label }}
        </p>
        <p
          class="truncate text-xl font-semibold leading-tight text-slate-950 dark:text-white sm:text-2xl"
          :title="value"
        >
          {{ value }}
        </p>
        <p v-if="helper" class="text-xs leading-5 text-slate-500 dark:text-slate-400">{{ helper }}</p>
      </div>
      <span
        class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border transition"
        :class="props.emphasis ? 'border-blue-200 bg-blue-600 text-white dark:border-blue-800' : 'border-slate-200 bg-slate-50 text-slate-400 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'"
      >
        <span class="h-2 w-2 rounded-full bg-current"></span>
      </span>
    </div>
  </article>
</template>
