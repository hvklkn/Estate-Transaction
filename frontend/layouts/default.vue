<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';

import { useAppI18n } from '~/composables/useAppI18n';
import type { AppLocale } from '~/locales/messages';
import { useAuthStore } from '~/stores/auth';

const { locale, locales, setLocale, t } = useAppI18n();
const authStore = useAuthStore();
const runtimeConfig = useRuntimeConfig();
const colorMode = useState<'light' | 'dark'>('color-mode', () => 'light');
const COLOR_MODE_STORAGE_KEY = 'iceberg.color-mode';
const currentYear = new Date().getFullYear();
const appEnv = computed(() => String(runtimeConfig.public.appEnv ?? 'development').toUpperCase());
const headerThemeClasses = computed(
  () =>
    'border-transparent bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 shadow-[0_6px_20px_rgba(37,99,235,0.35)]'
);

const brandButtonClasses = computed(
  () =>
    'border-white/90 bg-white text-blue-700 shadow-[0_6px_14px_rgba(255,255,255,0.35)] hover:border-white hover:bg-blue-50 hover:text-blue-800'
);

const panelClasses = computed(
  () =>
    'border-white/50 bg-blue-900/20 shadow-sm backdrop-blur hover:border-white/80 hover:bg-blue-900/30'
);

const selectedLocale = computed({
  get: () => locale.value,
  set: (nextLocale: AppLocale) => {
    setLocale(nextLocale);
  }
});

useHead(() => ({
  htmlAttrs: {
    lang: locale.value,
    class: colorMode.value === 'dark' ? 'dark' : undefined
  }
}));

const currentUserName = computed(() => authStore.currentUser?.name ?? null);

const handleLogout = async () => {
  authStore.logout();
  await navigateTo('/auth');
};

const setColorMode = (mode: 'light' | 'dark') => {
  colorMode.value = mode;
};

const toggleColorMode = () => {
  setColorMode(colorMode.value === 'dark' ? 'light' : 'dark');
};

onMounted(() => {
  const storedMode = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
  if (storedMode === 'light' || storedMode === 'dark') {
    setColorMode(storedMode);
    return;
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setColorMode(prefersDark ? 'dark' : 'light');
});

watch(
  colorMode,
  (mode) => {
    if (!import.meta.client) {
      return;
    }

    document.documentElement.classList.toggle('dark', mode === 'dark');
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  },
  { immediate: true }
);
</script>

<template>
  <div class="min-h-screen bg-brand-50/60 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
    <header
      class="sticky top-0 z-10 border-b backdrop-blur"
      :class="headerThemeClasses"
    >
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div class="min-w-0">
          <NuxtLink
            to="/"
            class="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-semibold tracking-tight shadow-sm transition-all hover:shadow"
            :class="brandButtonClasses"
          >
            <span class="sm:hidden">ET</span>
            <span class="hidden sm:inline">Estate Transaction</span>
          </NuxtLink>
        </div>

        <nav class="flex min-w-0 items-center gap-2 text-sm sm:gap-3">
          <button
            type="button"
            class="relative inline-flex h-8 w-16 items-center rounded-full border border-white/50 bg-blue-900/25 p-1 transition-colors hover:border-white/80 hover:bg-blue-900/35"
            :aria-label="colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            :aria-pressed="colorMode === 'dark'"
            @click="toggleColorMode"
          >
            <span class="flex w-full items-center justify-between px-1 text-[11px] leading-none text-blue-100">
              <span>☀</span>
              <span>🌙</span>
            </span>
            <span
              class="absolute top-1 h-6 w-6 rounded-full bg-white text-center text-sm leading-6 text-blue-700 shadow transition-all"
              :class="colorMode === 'dark' ? 'left-9' : 'left-1'"
            >
              {{ colorMode === 'dark' ? '🌙' : '☀' }}
            </span>
          </button>

          <label
            class="flex max-w-[110px] items-center gap-1 rounded-lg border px-2 py-1.5 transition-colors sm:max-w-none sm:gap-2 sm:px-2.5"
            :class="panelClasses"
          >
            <span
              class="hidden text-xs font-medium sm:inline"
              :class="'text-white/90'"
            >
              {{ t('layout.language') }}
            </span>
            <select
              v-model="selectedLocale"
              class="w-[72px] truncate rounded border-none bg-transparent py-0.5 pr-4 text-xs font-medium focus:outline-none focus:ring-0 sm:w-auto sm:pr-6"
              :class="'text-white'"
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
            class="inline-flex max-w-[140px] items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors sm:max-w-[240px] sm:px-3"
            :class="panelClasses"
          >
            <span
              class="truncate text-xs font-medium"
              :class="'text-white'"
            >
              {{ currentUserName }}
            </span>
            <button
              type="button"
              class="shrink-0 text-xs font-medium transition-colors"
              :class="'text-blue-100 hover:text-white'"
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

    <footer class="border-t border-slate-200 bg-white/80 px-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400 sm:px-6">
      <div class="mx-auto max-w-7xl py-8">
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <section class="space-y-2">
            <p class="text-base font-semibold text-slate-800 dark:text-slate-100">Estate Transaction</p>
            <p class="text-xs leading-5 text-slate-500 dark:text-slate-400">
              Real estate transaction lifecycle, stage traceability, and commission visibility in one operational dashboard.
            </p>
          </section>

          <section class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Quick Links</p>
            <div class="flex flex-col gap-1.5 text-sm">
              <NuxtLink to="/" class="transition-colors hover:text-brand-700 dark:hover:text-brand-300">Home</NuxtLink>
              <NuxtLink to="/transactions" class="transition-colors hover:text-brand-700 dark:hover:text-brand-300">Transactions</NuxtLink>
              <NuxtLink to="/auth" class="transition-colors hover:text-brand-700 dark:hover:text-brand-300">User Access</NuxtLink>
            </div>
          </section>

          <section class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Support</p>
            <div class="flex flex-col gap-1.5 text-sm">
              <a href="mailto:support@estatetransaction.app" class="transition-colors hover:text-brand-700 dark:hover:text-brand-300">support@estatetransaction.app</a>
              <a href="mailto:ops@estatetransaction.app" class="transition-colors hover:text-brand-700 dark:hover:text-brand-300">ops@estatetransaction.app</a>
              <span class="text-xs text-slate-500 dark:text-slate-400">Mon-Fri, 09:00-18:00</span>
            </div>
          </section>

          <section class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Legal</p>
            <div class="flex flex-col gap-1.5 text-sm">
              <a href="#" class="transition-colors hover:text-brand-700 dark:hover:text-brand-300">Privacy Policy</a>
              <a href="#" class="transition-colors hover:text-brand-700 dark:hover:text-brand-300">Terms of Service</a>
              <a href="#" class="transition-colors hover:text-brand-700 dark:hover:text-brand-300">Cookie Policy</a>
            </div>
          </section>
        </div>

        <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <p>&copy; {{ currentYear }} Estate Transaction. All rights reserved.</p>
          <span class="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            ENV: {{ appEnv }}
          </span>
        </div>
      </div>
    </footer>
  </div>
</template>
