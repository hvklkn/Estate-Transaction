<script setup lang="ts">
defineProps<{
  step: string;
  title: string;
  description: string;
}>();
</script>

<template>
  <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div class="flex items-start gap-4">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white dark:bg-blue-600">{{ step }}</span>
      <div>
        <h3 class="text-base font-semibold text-slate-950 dark:text-white">{{ title }}</h3>
        <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{{ description }}</p>
      </div>
    </div>
  </article>
</template>
