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
const isWorkspaceMenuOpen = ref(false);
const isUserMenuOpen = ref(false);
const COLOR_MODE_STORAGE_KEY = 'iceberg.color-mode';
const currentYear = new Date().getFullYear();
const appEnv = computed(() => String(runtimeConfig.public.appEnv ?? 'development').toUpperCase());

interface NavigationItem {
  to: string;
  label: string;
}

useHead(() => ({
  htmlAttrs: {
    lang: 'en',
    class: colorMode.value === 'dark' ? 'dark' : undefined
  }
}));

const currentUserName = computed(() => authStore.currentUser?.name ?? null);
const currentUserEmail = computed(() => authStore.currentUser?.email ?? null);
const currentOrganizationName = computed(() => authStore.currentUser?.organization?.name ?? 'No organization');
const currentUserRoleLabel = computed(() => formatRoleLabel(authStore.currentUser?.role ?? null));
const currentUserInitials = computed(() => {
  const source = currentUserName.value || currentUserEmail.value || 'User';
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || 'U';
});
const primaryNavigationItems = computed<NavigationItem[]>(() => [
  {
    to: '/transactions',
    label: t('layout.navigation.transactions')
  },
  {
    to: '/clients',
    label: 'Clients'
  },
  {
    to: '/properties',
    label: 'Properties'
  },
  {
    to: '/tasks',
    label: 'Tasks'
  },
  {
    to: '/reports',
    label: 'Reports'
  }
]);
const workspaceNavigationItems = computed<NavigationItem[]>(() => {
  const items: NavigationItem[] = [
    {
      to: '/balance',
      label: 'Balance'
    }
  ];

  if (authStore.canManageTeam) {
    items.push({
      to: '/team',
      label: 'Team'
    });
  }

  items.push({
    to: '/profile',
    label: 'Profile'
  });
  items.push({
    to: '/settings',
    label: t('layout.navigation.settings')
  });

  return items;
});
const isWorkspaceActive = computed(() => workspaceNavigationItems.value.some((item) => isRouteActive(item.to)));

const handleLogout = async () => {
  await authStore.logout();
  closeMenus();
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
  isWorkspaceMenuOpen.value = false;
  isUserMenuOpen.value = false;
};

const toggleWorkspaceMenu = () => {
  isWorkspaceMenuOpen.value = !isWorkspaceMenuOpen.value;
  isUserMenuOpen.value = false;
  isMobileMenuOpen.value = false;
};

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value;
  isWorkspaceMenuOpen.value = false;
  isMobileMenuOpen.value = false;
};

const closeMenus = () => {
  isMobileMenuOpen.value = false;
  isWorkspaceMenuOpen.value = false;
  isUserMenuOpen.value = false;
};

const isRouteActive = (targetPath: string): boolean => route.path === targetPath || route.path.startsWith(`${targetPath}/`);

const formatRoleLabel = (role: string | null): string => {
  if (!role) {
    return 'No role';
  }

  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

watch(
  () => route.path,
  () => {
    closeMenus();
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
    <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 dark:shadow-none">
      <div class="mx-auto max-w-7xl px-4 sm:px-6">
        <div class="flex h-16 items-center gap-3">
          <div class="flex min-w-0 shrink-0 items-center lg:w-[220px]">
            <NuxtLink to="/" class="group inline-flex min-w-0 items-center gap-2 rounded-full px-1.5 py-1.5 transition-colors hover:bg-blue-50 dark:hover:bg-slate-900">
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white shadow-sm shadow-blue-600/25">
                ET
              </span>
              <span class="hidden min-w-0 flex-col leading-tight sm:flex">
                <span class="truncate text-sm font-semibold text-slate-950 dark:text-white">Estate Transaction</span>
                <span class="truncate text-[11px] font-medium text-blue-600 dark:text-blue-300">Dashboard</span>
              </span>
            </NuxtLink>
          </div>

          <nav class="hidden min-w-0 flex-1 justify-center lg:flex" aria-label="Primary navigation">
            <div class="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-800 dark:bg-slate-900/70">
              <NuxtLink
                v-for="navigationItem in primaryNavigationItems"
                :key="navigationItem.to"
                :to="navigationItem.to"
                class="whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-colors"
                :class="isRouteActive(navigationItem.to) ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25' : 'text-slate-600 hover:bg-white hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300'"
              >
                {{ navigationItem.label }}
              </NuxtLink>
            </div>
          </nav>

          <div class="ml-auto flex min-w-0 items-center justify-end gap-2 lg:w-[320px]">
            <button
              type="button"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:bg-blue-950/50 dark:hover:text-blue-300"
              :aria-label="colorMode === 'dark' ? t('layout.theme.switchToLight') : t('layout.theme.switchToDark')"
              :aria-pressed="colorMode === 'dark'"
              @click="toggleColorMode"
            >
              <svg v-if="colorMode === 'dark'" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M12 3v2.5M12 18.5V21M4.7 4.7l1.8 1.8M17.5 17.5l1.8 1.8M3 12h2.5M18.5 12H21M4.7 19.3l1.8-1.8M17.5 6.5l1.8-1.8" stroke-linecap="round" />
                <circle cx="12" cy="12" r="4" />
              </svg>
              <svg v-else viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M20.5 14.5A7.5 7.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z" stroke-linejoin="round" />
              </svg>
            </button>

            <div class="relative hidden md:block">
              <button
                type="button"
                class="inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors"
                :class="isWorkspaceActive || isWorkspaceMenuOpen ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:bg-blue-950/50 dark:hover:text-blue-300'"
                :aria-expanded="isWorkspaceMenuOpen"
                aria-haspopup="menu"
                @click="toggleWorkspaceMenu"
              >
                <span>Workspace</span>
                <svg viewBox="0 0 20 20" class="h-4 w-4 transition-transform" :class="isWorkspaceMenuOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path d="M5 7.5 10 12.5 15 7.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>

              <div v-if="isWorkspaceMenuOpen" class="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900" role="menu">
                <NuxtLink
                  v-for="navigationItem in workspaceNavigationItems"
                  :key="navigationItem.to"
                  :to="navigationItem.to"
                  class="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors"
                  :class="isRouteActive(navigationItem.to) ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'"
                  role="menuitem"
                  @click="closeMenus"
                >
                  {{ navigationItem.label }}
                  <span v-if="isRouteActive(navigationItem.to)" class="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-300"></span>
                </NuxtLink>
              </div>
            </div>

            <div v-if="currentUserName" class="relative">
              <button
                type="button"
                class="inline-flex h-9 max-w-[180px] items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-2 text-left transition-colors hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 dark:hover:bg-blue-950/50 sm:pr-3"
                :aria-expanded="isUserMenuOpen"
                aria-haspopup="menu"
                @click="toggleUserMenu"
              >
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white dark:bg-blue-600">
                  {{ currentUserInitials }}
                </span>
                <span class="hidden min-w-0 leading-tight sm:block">
                  <span class="block truncate text-xs font-semibold text-slate-900 dark:text-white">{{ currentUserName }}</span>
                  <span class="block truncate text-[11px] text-slate-500 dark:text-slate-400">{{ currentUserRoleLabel }}</span>
                </span>
                <svg viewBox="0 0 20 20" class="hidden h-4 w-4 shrink-0 text-slate-400 transition-transform sm:block" :class="isUserMenuOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path d="M5 7.5 10 12.5 15 7.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>

              <div v-if="isUserMenuOpen" class="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900" role="menu">
                <div class="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
                  <p class="truncate text-sm font-semibold text-slate-950 dark:text-white">{{ currentUserName }}</p>
                  <p class="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{{ currentUserEmail }}</p>
                  <p class="mt-2 truncate text-xs font-medium text-blue-700 dark:text-blue-300">{{ currentOrganizationName }}</p>
                </div>
                <button type="button" class="mt-2 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-slate-300 dark:hover:bg-red-950/30 dark:hover:text-red-300" role="menuitem" @click="handleLogout">
                  <span>{{ t('auth.actions.logout') }}</span>
                  <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <path d="M7.5 4.5H5a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 5 15.5h2.5M12 6l4 4-4 4M15.5 10h-8" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            <NuxtLink v-else to="/auth" class="hidden rounded-full bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 sm:inline-flex">
              Sign in
            </NuxtLink>

            <button
              type="button"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:bg-blue-950/50 dark:hover:text-blue-300 lg:hidden"
              :aria-label="isMobileMenuOpen ? t('layout.menu.close') : t('layout.menu.open')"
              :aria-expanded="isMobileMenuOpen"
              @click="toggleMobileMenu"
            >
              <svg v-if="!isMobileMenuOpen" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
              </svg>
              <svg v-else viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="isMobileMenuOpen" class="border-t border-slate-200 py-3 dark:border-slate-800 lg:hidden">
          <nav class="flex gap-2 overflow-x-auto pb-1" aria-label="Mobile primary navigation">
            <NuxtLink
              v-for="navigationItem in primaryNavigationItems"
              :key="navigationItem.to"
              :to="navigationItem.to"
              class="whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-colors"
              :class="isRouteActive(navigationItem.to) ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-blue-950/50 dark:hover:text-blue-300'"
              @click="closeMenus"
            >
              {{ navigationItem.label }}
            </NuxtLink>
          </nav>

          <div class="mt-3 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/70">
            <p class="px-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Workspace</p>
            <NuxtLink
              v-for="navigationItem in workspaceNavigationItems"
              :key="navigationItem.to"
              :to="navigationItem.to"
              class="rounded-xl px-3 py-2 text-sm font-medium transition-colors"
              :class="isRouteActive(navigationItem.to) ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-300' : 'text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'"
              @click="closeMenus"
            >
              {{ navigationItem.label }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <slot />
    </main>

    <footer class="mt-12 border-t border-slate-200 bg-white/95 px-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-400 sm:px-6">
      <div class="mx-auto max-w-7xl py-10 lg:py-12">
        <div class="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 sm:p-8">
          <div class="grid gap-8 lg:grid-cols-[1.25fr_2fr]">
            <section>
              <div class="inline-flex items-center gap-2">
                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white shadow-sm shadow-blue-600/25">ET</span>
                <div>
                  <p class="text-base font-semibold text-slate-950 dark:text-white">Estate Transaction</p>
                  <p class="text-xs font-medium text-blue-700 dark:text-blue-300">Real estate operations dashboard</p>
                </div>
              </div>
              <p class="mt-4 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                A focused operating layer for transaction lifecycle tracking, client context, property inventory, tasks, and commission visibility.
              </p>
            </section>

            <div class="grid gap-6 sm:grid-cols-3">
              <section>
                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Product</p>
                <div class="mt-3 flex flex-col gap-2">
                  <NuxtLink to="/transactions" class="transition-colors hover:text-blue-700 dark:hover:text-blue-300">Transactions</NuxtLink>
                  <NuxtLink to="/clients" class="transition-colors hover:text-blue-700 dark:hover:text-blue-300">Clients</NuxtLink>
                  <NuxtLink to="/properties" class="transition-colors hover:text-blue-700 dark:hover:text-blue-300">Properties</NuxtLink>
                  <NuxtLink to="/tasks" class="transition-colors hover:text-blue-700 dark:hover:text-blue-300">Tasks</NuxtLink>
                  <NuxtLink to="/reports" class="transition-colors hover:text-blue-700 dark:hover:text-blue-300">Reports</NuxtLink>
                </div>
              </section>

              <section>
                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Workspace</p>
                <div class="mt-3 flex flex-col gap-2">
                  <NuxtLink to="/balance" class="transition-colors hover:text-blue-700 dark:hover:text-blue-300">Balance</NuxtLink>
                  <NuxtLink v-if="authStore.canManageTeam" to="/team" class="transition-colors hover:text-blue-700 dark:hover:text-blue-300">Team</NuxtLink>
                  <NuxtLink to="/profile" class="transition-colors hover:text-blue-700 dark:hover:text-blue-300">Profile</NuxtLink>
                  <NuxtLink to="/settings" class="transition-colors hover:text-blue-700 dark:hover:text-blue-300">Settings</NuxtLink>
                  <NuxtLink to="/auth" class="transition-colors hover:text-blue-700 dark:hover:text-blue-300">User Access</NuxtLink>
                </div>
              </section>

              <section>
                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Support</p>
                <div class="mt-3 flex flex-col gap-2">
                  <a href="mailto:support@estatetransaction.app" class="transition-colors hover:text-blue-700 dark:hover:text-blue-300">support@estatetransaction.app</a>
                  <a href="mailto:ops@estatetransaction.app" class="transition-colors hover:text-blue-700 dark:hover:text-blue-300">ops@estatetransaction.app</a>
                  <a href="#" class="transition-colors hover:text-blue-700 dark:hover:text-blue-300">Privacy Policy</a>
                  <a href="#" class="transition-colors hover:text-blue-700 dark:hover:text-blue-300">Terms of Service</a>
                </div>
              </section>
            </div>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p>&copy; {{ currentYear }} Estate Transaction. All rights reserved.</p>
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">ENV: {{ appEnv }}</span>
            <a href="#" class="rounded-full border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-600 transition hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-blue-300">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
