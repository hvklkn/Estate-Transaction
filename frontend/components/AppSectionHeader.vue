<script setup lang="ts">
withDefaults(defineProps<{
  title: string;
  description?: string;
}>(), {
  description: undefined
});
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div class="min-w-0">
      <h2 class="text-lg font-semibold text-slate-950 dark:text-white">{{ title }}</h2>
      <p v-if="description" class="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
      <slot name="actions"></slot>
    </div>
  </div>
</template>
