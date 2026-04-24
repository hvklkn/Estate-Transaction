<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { useAppI18n } from '~/composables/useAppI18n';
import { useAuthStore } from '~/stores/auth';

const { t } = useAppI18n();
const authStore = useAuthStore();
const route = useRoute();
const runtimeConfig = useRuntimeConfig();
const colorMode = useState<'light' | 'dark'>('color-mode', () => 'light');
const isMobileMenuOpen = ref(false);
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

useHead(() => ({
  htmlAttrs: {
    lang: 'en',
    class: colorMode.value === 'dark' ? 'dark' : undefined
  }
}));

const currentUserName = computed(() => authStore.currentUser?.name ?? null);
const navigationItems = computed(() => [
  {
    to: '/transactions',
    label: t('layout.navigation.transactions')
  },
  {
    to: '/balance',
    label: 'Balance'
  },
  {
    to: '/profile',
    label: 'Profile'
  },
  {
    to: '/settings',
    label: t('layout.navigation.settings')
  }
]);

const handleLogout = async () => {
  await authStore.logout();
  isMobileMenuOpen.value = false;
  await navigateTo('/auth');
};

const setColorMode = (mode: 'light' | 'dark') => {
  colorMode.value = mode;
};

const toggleColorMode = () => {
  setColorMode(colorMode.value === 'dark' ? 'light' : 'dark');
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const isRouteActive = (targetPath: string): boolean =>
  route.path === targetPath || route.path.startsWith(`${targetPath}/`);

watch(
  () => route.path,
  () => {
    isMobileMenuOpen.value = false;
  }
);

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
      <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2 sm:gap-3">
            <NuxtLink
              to="/"
              class="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-semibold tracking-tight shadow-sm transition-all hover:shadow"
              :class="brandButtonClasses"
            >
              <span class="sm:hidden">ET</span>
              <span class="hidden sm:inline">Estate Transaction</span>
            </NuxtLink>

            <nav class="hidden items-center gap-2 md:flex">
              <NuxtLink
                v-for="navigationItem in navigationItems"
                :key="navigationItem.to"
                :to="navigationItem.to"
                class="rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-colors"
                :class="
                  isRouteActive(navigationItem.to)
                    ? 'border-white bg-white text-blue-700 shadow-sm'
                    : 'border-white/45 bg-blue-900/20 text-blue-100 hover:border-white/80 hover:bg-blue-900/35 hover:text-white'
                "
              >
                {{ navigationItem.label }}
              </NuxtLink>
            </nav>
          </div>

          <div class="hidden min-w-0 items-center gap-2 text-sm sm:gap-3 md:flex">
            <button
              type="button"
              class="relative inline-flex h-8 w-16 items-center rounded-full border border-white/50 bg-blue-900/25 p-1 transition-colors hover:border-white/80 hover:bg-blue-900/35"
              :aria-label="colorMode === 'dark' ? t('layout.theme.switchToLight') : t('layout.theme.switchToDark')"
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
          </div>

          <div class="flex items-center gap-2 md:hidden">
            <button
              type="button"
              class="relative inline-flex h-8 w-16 items-center rounded-full border border-white/50 bg-blue-900/25 p-1 transition-colors hover:border-white/80 hover:bg-blue-900/35"
              :aria-label="colorMode === 'dark' ? t('layout.theme.switchToLight') : t('layout.theme.switchToDark')"
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

            <button
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/50 bg-blue-900/25 text-white transition-colors hover:border-white hover:bg-blue-900/35"
              :aria-label="isMobileMenuOpen ? t('layout.menu.close') : t('layout.menu.open')"
              :aria-expanded="isMobileMenuOpen"
              @click="toggleMobileMenu"
            >
              <svg v-if="!isMobileMenuOpen" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
              </svg>
              <svg v-else viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div
          v-if="isMobileMenuOpen"
          class="mt-3 rounded-xl border border-white/40 bg-blue-900/40 p-3 md:hidden"
        >
          <nav class="grid gap-2">
            <NuxtLink
              v-for="navigationItem in navigationItems"
              :key="navigationItem.to"
              :to="navigationItem.to"
              class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
              :class="
                isRouteActive(navigationItem.to)
                  ? 'border-white bg-white text-blue-700'
                  : 'border-white/40 bg-blue-900/20 text-blue-100 hover:border-white/80 hover:bg-blue-900/30'
              "
            >
              {{ navigationItem.label }}
            </NuxtLink>
          </nav>

          <div class="mt-3 space-y-2 border-t border-white/25 pt-3">
            <div
              v-if="currentUserName"
              class="flex items-center justify-between gap-3 rounded-lg border border-white/35 bg-blue-900/25 px-3 py-2"
            >
              <span class="truncate text-xs font-medium text-white">{{ currentUserName }}</span>
              <button
                type="button"
                class="shrink-0 text-xs font-medium text-blue-100 transition-colors hover:text-white"
                @click="handleLogout"
              >
                {{ t('auth.actions.logout') }}
              </button>
            </div>
          </div>
        </div>
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
              <NuxtLink to="/balance" class="transition-colors hover:text-brand-700 dark:hover:text-brand-300">Balance</NuxtLink>
              <NuxtLink to="/profile" class="transition-colors hover:text-brand-700 dark:hover:text-brand-300">Profile</NuxtLink>
              <NuxtLink to="/settings" class="transition-colors hover:text-brand-700 dark:hover:text-brand-300">Settings</NuxtLink>
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
