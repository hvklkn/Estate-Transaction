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
    ? 'border-brand-200 bg-gradient-to-br from-brand-50 to-white shadow-[0_8px_30px_rgba(38,79,144,0.08)]'
    : 'border-slate-200 bg-white shadow-sm'
);
</script>

<template>
  <article class="rounded-2xl border p-5 transition-colors" :class="rootClass">
    <div class="space-y-2">
      <p
        class="text-[11px] font-semibold uppercase tracking-[0.14em]"
        :class="props.emphasis ? 'text-brand-700' : 'text-slate-500'"
      >
        {{ label }}
      </p>
      <p class="text-2xl font-semibold leading-tight text-slate-900 lg:text-3xl">{{ value }}</p>
      <p v-if="helper" class="text-xs leading-5 text-slate-500">{{ helper }}</p>
    </div>
  </article>
</template>
