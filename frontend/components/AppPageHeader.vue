<script setup lang="ts">
withDefaults(defineProps<{
  eyebrow: string;
  title: string;
  description: string;
  meta?: string;
}>(), {
  meta: undefined
});
</script>

<template>
  <header class="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-6 lg:p-7">
    <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-brand-700 to-slate-950 dark:from-blue-400 dark:via-blue-700 dark:to-slate-700"></div>
    <div class="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div class="min-w-0 space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">{{ eyebrow }}</p>
        <h1 class="text-3xl font-semibold leading-tight text-slate-950 dark:text-white sm:text-4xl">{{ title }}</h1>
        <p class="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">{{ description }}</p>
        <p v-if="meta" class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ meta }}</p>
        <slot name="meta"></slot>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
        <slot name="actions"></slot>
      </div>
    </div>
  </header>
</template>
