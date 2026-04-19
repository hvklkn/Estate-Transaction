<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useAppI18n } from '~/composables/useAppI18n';
import { useUserSettings } from '~/composables/useUserSettings';

const { t } = useAppI18n();
const { settings, hydrateFromStorage } = useUserSettings();
const colorMode = useState<'light' | 'dark'>('color-mode', () => 'light');

const compactCards = computed({
  get: () => settings.value.compactCards,
  set: (nextValue: boolean) => {
    settings.value.compactCards = nextValue;
  }
});

const pushNotifications = computed({
  get: () => settings.value.pushNotifications,
  set: (nextValue: boolean) => {
    settings.value.pushNotifications = nextValue;
  }
});

const emailSummaries = computed({
  get: () => settings.value.emailSummaries,
  set: (nextValue: boolean) => {
    settings.value.emailSummaries = nextValue;
  }
});

useHead(() => ({
  title: t('settings.meta.title')
}));

const setTheme = (mode: 'light' | 'dark') => {
  colorMode.value = mode;
};

onMounted(() => {
  hydrateFromStorage();
});
</script>

<template>
  <section class="space-y-6">
    <header class="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/70 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900 sm:p-7">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
        {{ t('settings.header.kicker') }}
      </p>
      <h1 class="mt-2 text-3xl font-semibold sm:text-4xl">{{ t('settings.header.title') }}</h1>
      <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
        {{ t('settings.header.description') }}
      </p>
    </header>

    <div class="grid gap-4 lg:grid-cols-2">
      <article class="panel">
        <div class="panel-body space-y-4">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('settings.preferences.title') }}</h2>

          <div class="space-y-3">
            <label class="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
              <div>
                <p class="text-sm font-medium text-slate-800 dark:text-slate-100">{{ t('settings.preferences.compactCardsLabel') }}</p>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ t('settings.preferences.compactCardsHint') }}</p>
              </div>
              <input v-model="compactCards" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-200 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-brand-900" />
            </label>

            <label class="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
              <div>
                <p class="text-sm font-medium text-slate-800 dark:text-slate-100">{{ t('settings.preferences.pushNotificationsLabel') }}</p>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ t('settings.preferences.pushNotificationsHint') }}</p>
              </div>
              <input v-model="pushNotifications" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-200 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-brand-900" />
            </label>

            <label class="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
              <div>
                <p class="text-sm font-medium text-slate-800 dark:text-slate-100">{{ t('settings.preferences.emailSummariesLabel') }}</p>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ t('settings.preferences.emailSummariesHint') }}</p>
              </div>
              <input v-model="emailSummaries" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-200 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-brand-900" />
            </label>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-body space-y-5">
          <div>
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('settings.appearance.title') }}</h2>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ t('settings.appearance.description') }}</p>
          </div>

          <div class="space-y-2">
            <p class="field-label">{{ t('settings.appearance.themeLabel') }}</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                :class="
                  colorMode === 'light'
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-950/40 dark:text-brand-200'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                "
                @click="setTheme('light')"
              >
                {{ t('settings.appearance.light') }}
              </button>
              <button
                type="button"
                class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                :class="
                  colorMode === 'dark'
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-950/40 dark:text-brand-200'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                "
                @click="setTheme('dark')"
              >
                {{ t('settings.appearance.dark') }}
              </button>
            </div>
          </div>

        </div>
      </article>
    </div>
  </section>
</template>
