<script setup lang="ts">
defineProps<{
  eyebrow: string;
  title: string;
  description: string;
  metric?: string;
}>();
</script>

<template>
  <article class="group rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none dark:hover:border-blue-900">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">{{ eyebrow }}</p>
        <h3 class="mt-3 text-base font-semibold text-slate-950 dark:text-white">{{ title }}</h3>
      </div>
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
        <span class="h-2.5 w-2.5 rounded-full bg-current"></span>
      </span>
    </div>
    <p class="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{{ description }}</p>
    <p v-if="metric" class="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">{{ metric }}</p>
  </article>
</template>
