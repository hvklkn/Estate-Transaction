<script setup lang="ts">
withDefaults(defineProps<{
  title: string;
  description?: string;
}>(), {
  description: undefined
});
</script>

<template>
  <div class="empty-state">
    <div class="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path d="M7 8h10M7 12h7M7 16h5" stroke-linecap="round" />
        <path d="M5.5 3.5h13A1.5 1.5 0 0 1 20 5v14a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V5a1.5 1.5 0 0 1 1.5-1.5Z" />
      </svg>
    </div>
    <h3 class="text-base font-semibold text-slate-950 dark:text-white">{{ title }}</h3>
    <p v-if="description" class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">{{ description }}</p>
    <div v-if="$slots.actions" class="mt-5 flex flex-wrap justify-center gap-2">
      <slot name="actions"></slot>
    </div>
  </div>
</template>
