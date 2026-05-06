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
    <AppPageHeader
      :eyebrow="t('settings.header.kicker')"
      :title="t('settings.header.title')"
      :description="t('settings.header.description')"
      meta="Workspace display preferences are stored locally for this browser session."
    />

    <div class="grid gap-4 lg:grid-cols-2">
      <article class="panel">
        <div class="panel-body space-y-4">
          <AppSectionHeader
            :title="t('settings.preferences.title')"
            description="Tune how dense the workspace feels and which operational updates should reach you."
          />

          <div class="space-y-3">
            <label class="option-row">
              <div>
                <p class="text-sm font-medium text-slate-800 dark:text-slate-100">{{ t('settings.preferences.compactCardsLabel') }}</p>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ t('settings.preferences.compactCardsHint') }}</p>
              </div>
              <input v-model="compactCards" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-200 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-brand-900" />
            </label>

            <label class="option-row">
              <div>
                <p class="text-sm font-medium text-slate-800 dark:text-slate-100">{{ t('settings.preferences.pushNotificationsLabel') }}</p>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ t('settings.preferences.pushNotificationsHint') }}</p>
              </div>
              <input v-model="pushNotifications" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-200 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-brand-900" />
            </label>

            <label class="option-row">
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
          <AppSectionHeader :title="t('settings.appearance.title')" :description="t('settings.appearance.description')" />

          <div class="space-y-2">
            <p class="field-label">{{ t('settings.appearance.themeLabel') }}</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class="rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors"
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
                class="rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors"
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
