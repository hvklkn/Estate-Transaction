<script setup lang="ts">
import { computed } from 'vue';

import { useAppI18n } from '~/composables/useAppI18n';
import type { AppLocale } from '~/locales/messages';
import { useAuthStore } from '~/stores/auth';

const { locale, locales, setLocale, t } = useAppI18n();
const authStore = useAuthStore();

const selectedLocale = computed({
  get: () => locale.value,
  set: (nextLocale: AppLocale) => {
    setLocale(nextLocale);
  }
});

useHead(() => ({
  htmlAttrs: {
    lang: locale.value
  }
}));

const currentUserName = computed(() => authStore.currentUser?.name ?? null);

const handleLogout = async () => {
  authStore.logout();
  await navigateTo('/auth');
};
</script>

<template>
  <div class="min-h-screen bg-brand-50/60">
    <header class="sticky top-0 z-10 border-b border-slate-200/90 bg-white/90 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          <NuxtLink to="/transactions" class="text-xl font-semibold tracking-tight text-brand-900">
            Iceberg
          </NuxtLink>
          <p class="mt-0.5 text-xs text-slate-500">{{ t('layout.subtitle') }}</p>
        </div>

        <nav class="flex flex-wrap items-center gap-3 text-sm">
          <NuxtLink
            to="/transactions"
            class="rounded-lg px-3 py-2 font-medium text-slate-600 transition hover:bg-brand-100 hover:text-brand-900"
            active-class="bg-brand-100/70 text-brand-900"
          >
            {{ t('layout.navigation.transactions') }}
          </NuxtLink>

          <label class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
            <span class="text-xs font-medium text-slate-600">{{ t('layout.language') }}</span>
            <select
              v-model="selectedLocale"
              class="rounded border-none bg-transparent py-0.5 pr-6 text-xs font-medium text-slate-700 focus:outline-none focus:ring-0"
              :aria-label="t('layout.language')"
            >
              <option
                v-for="localeOption in locales"
                :key="localeOption.code"
                :value="localeOption.code"
              >
                {{ localeOption.label }}
              </option>
            </select>
          </label>

          <div
            v-if="currentUserName"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5"
          >
            <span class="text-xs font-medium text-slate-600">{{ currentUserName }}</span>
            <button
              type="button"
              class="text-xs font-medium text-slate-500 hover:text-slate-700"
              @click="handleLogout"
            >
              {{ t('auth.actions.logout') }}
            </button>
          </div>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <slot />
    </main>
  </div>
</template>
