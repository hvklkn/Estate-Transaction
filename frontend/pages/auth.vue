<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

import { useAppI18n } from '~/composables/useAppI18n';
import { toApiErrorMessage } from '~/services/api.errors';
import { useAgentsApi } from '~/services/agents.api';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const agentsApi = useAgentsApi();
const config = useRuntimeConfig();
const { t } = useAppI18n();

useHead(() => ({
  title: t('auth.meta.title')
}));

const mode = ref<'login' | 'register'>('login');
const forgotStep = ref<'request' | 'confirm'>('request');
const showForgotPassword = ref(false);

const loginForm = reactive({
  email: '',
  password: '',
  twoFactorCode: ''
});

const registerForm = reactive({
  name: '',
  email: '',
  organizationName: '',
  organizationSlug: '',
  password: '',
  confirmPassword: ''
});

const forgotForm = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmNewPassword: ''
});

const loginTwoFactorRequired = ref(false);
const loginTwoFactorMethod = ref<'sms' | 'authenticator'>('authenticator');
const authHint = ref<string | null>(null);
const forgotError = ref<string | null>(null);
const forgotSuccess = ref<string | null>(null);
const isForgotSubmitting = ref(false);

const isSubmitting = computed(() => authStore.isLoggingIn || authStore.isRegistering || isForgotSubmitting.value);
const registrationEnabled = computed(() => String(config.public.registrationEnabled ?? 'true').toLowerCase() !== 'false');
const valueBullets = [
  'Stage traceability from intake to close',
  'CRM clients and inventory in the same workspace',
  'Commission and balance visibility without spreadsheet drift'
];
const heroStats = [
  {
    value: '360',
    label: 'Lifecycle visibility'
  },
  {
    value: '1',
    label: 'Operational source of truth'
  },
  {
    value: 'Live',
    label: 'Balance tracking'
  }
];
const productFeatures = [
  {
    eyebrow: 'Lifecycle',
    title: 'Transaction Lifecycle',
    description: 'Track every deal through centralized stages, participant assignments, notes, and operational status.',
    metric: 'Pipeline, closings, and completed deals stay visible.'
  },
  {
    eyebrow: 'CRM',
    title: 'CRM Clients',
    description: 'Keep buyer, seller, tenant, and landlord records connected to transactions and property workflows.',
    metric: 'Client context follows the deal.'
  },
  {
    eyebrow: 'Inventory',
    title: 'Property Inventory',
    description: 'Manage listings, owner links, pricing, and availability from the same workspace as transactions.',
    metric: 'Properties become reusable operational assets.'
  },
  {
    eyebrow: 'Finance',
    title: 'Commission & Balance Visibility',
    description: 'Make agency and advisor earnings easier to review with clear balance and ledger-style visibility.',
    metric: 'Less reconciliation work at closing.'
  },
  {
    eyebrow: 'Operations',
    title: 'Reports & Tasks',
    description: 'Monitor workload, overdue tasks, stage distribution, and performance signals with focused dashboards.',
    metric: 'Daily operations become easier to scan.'
  }
];
const workflowSteps = [
  {
    step: '01',
    title: 'Create a workspace or sign in',
    description: 'The first account creates the office workspace. Team members are added later from the authenticated Team area.'
  },
  {
    step: '02',
    title: 'Build your operating base',
    description: 'Add clients, properties, agents, and transaction records with organization-aware permissions.'
  },
  {
    step: '03',
    title: 'Run the transaction flow',
    description: 'Move deals through stages, assign tasks, and keep balance visibility aligned with the operational record.'
  }
];

const switchMode = (nextMode: 'login' | 'register') => {
  if (nextMode === 'register' && !registrationEnabled.value) {
    mode.value = 'login';
    return;
  }

  mode.value = nextMode;
  authHint.value = null;
  authStore.setError(null);
  loginTwoFactorRequired.value = false;
  loginForm.twoFactorCode = '';
};

const onLogin = async () => {
  authHint.value = null;

  const loginResult = await authStore.login({
    email: loginForm.email.trim().toLowerCase(),
    password: loginForm.password,
    twoFactorCode: loginForm.twoFactorCode.trim() || undefined,
    device: 'Web Browser',
    location: 'Current Network',
    userAgent: import.meta.client ? window.navigator.userAgent : 'Unknown User Agent'
  });

  if (loginResult && 'requiresTwoFactor' in loginResult) {
    loginTwoFactorRequired.value = true;
    loginTwoFactorMethod.value = loginResult.twoFactorMethod;
    authHint.value = loginTwoFactorMethod.value === 'authenticator' ? 'Enter the 6-digit code from your authenticator app.' : 'Enter the 6-digit SMS verification code.';
    return;
  }

  loginTwoFactorRequired.value = false;
  loginForm.twoFactorCode = '';
  await navigateTo('/transactions');
};

const onRegister = async () => {
  authHint.value = null;

  if (registerForm.password.length < 8) {
    authStore.setError('Password must be at least 8 characters.');
    return;
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    authStore.setError('Password confirmation does not match.');
    return;
  }

  await authStore.register({
    name: registerForm.name.trim(),
    email: registerForm.email.trim().toLowerCase(),
    password: registerForm.password,
    organizationName: registerForm.organizationName.trim() || undefined,
    organizationSlug: registerForm.organizationSlug.trim().toLowerCase() || undefined
  });

  await navigateTo('/transactions');
};

const openForgotPassword = () => {
  showForgotPassword.value = true;
  forgotStep.value = 'request';
  forgotError.value = null;
  forgotSuccess.value = null;
  authStore.setError(null);
};

const closeForgotPassword = () => {
  showForgotPassword.value = false;
  forgotStep.value = 'request';
  forgotError.value = null;
  forgotSuccess.value = null;
  forgotForm.code = '';
  forgotForm.newPassword = '';
  forgotForm.confirmNewPassword = '';
};

const onRequestResetCode = async () => {
  isForgotSubmitting.value = true;
  forgotError.value = null;
  forgotSuccess.value = null;
  authStore.setError(null);

  try {
    const email = forgotForm.email.trim().toLowerCase();
    const response = await agentsApi.requestPasswordResetCode({ email });
    forgotForm.email = email;
    forgotStep.value = 'confirm';
    if (response.developmentCode) {
      forgotSuccess.value = `Development code: ${response.developmentCode}`;
      forgotForm.code = response.developmentCode;
    } else {
      forgotSuccess.value = 'Verification code has been sent to your e-mail address.';
    }
  } catch (unknownError) {
    forgotError.value = toApiErrorMessage(unknownError);
  } finally {
    isForgotSubmitting.value = false;
  }
};

const onResetPasswordWithCode = async () => {
  isForgotSubmitting.value = true;
  forgotError.value = null;
  forgotSuccess.value = null;
  authStore.setError(null);

  if (forgotForm.newPassword.length < 8) {
    forgotError.value = 'Password must be at least 8 characters.';
    isForgotSubmitting.value = false;
    return;
  }

  if (forgotForm.newPassword !== forgotForm.confirmNewPassword) {
    forgotError.value = 'Password confirmation does not match.';
    isForgotSubmitting.value = false;
    return;
  }

  try {
    await agentsApi.resetPasswordWithCode({
      email: forgotForm.email.trim().toLowerCase(),
      code: forgotForm.code.trim(),
      newPassword: forgotForm.newPassword,
      confirmNewPassword: forgotForm.confirmNewPassword
    });
    forgotSuccess.value = 'Password updated. You can now sign in with your new password.';
    forgotStep.value = 'request';
    forgotForm.code = '';
    forgotForm.newPassword = '';
    forgotForm.confirmNewPassword = '';
    showForgotPassword.value = false;
    mode.value = 'login';
  } catch (unknownError) {
    forgotError.value = toApiErrorMessage(unknownError);
  } finally {
    isForgotSubmitting.value = false;
  }
};
</script>

<template>
  <section class="space-y-16 lg:space-y-20">
    <section class="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-slate-100 px-5 py-8 shadow-xl shadow-blue-950/10 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/60 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-brand-700 to-slate-900 dark:from-blue-400 dark:via-blue-700 dark:to-slate-600"></div>

      <div class="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_430px] lg:items-center">
        <div class="space-y-8">
          <div class="max-w-3xl">
            <p class="inline-flex rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 shadow-sm dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              Estate operations platform
            </p>
            <h1 class="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
              Run every property deal from one calm operating system.
            </h1>
            <p class="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              Estate Transaction brings lifecycle stages, CRM clients, property inventory, tasks, and commission visibility into a single workspace built for modern real estate teams.
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <div v-for="stat in heroStats" :key="stat.label" class="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
              <p class="text-xl font-semibold text-slate-950 dark:text-white">{{ stat.value }}</p>
              <p class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ stat.label }}</p>
            </div>
          </div>

          <ul class="grid gap-3 text-sm font-medium text-slate-700 dark:text-slate-200 sm:grid-cols-3">
            <li v-for="bullet in valueBullets" :key="bullet" class="flex items-start gap-2">
              <svg viewBox="0 0 20 20" class="mt-0.5 h-4 w-4 shrink-0 text-blue-700 dark:text-blue-300" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="m4.5 10.5 3.5 3.5 7.5-8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>{{ bullet }}</span>
            </li>
          </ul>

          <div class="rounded-[1.75rem] border border-white/80 bg-white/75 p-4 shadow-2xl shadow-blue-950/10 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <div class="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Live workspace preview</p>
                <p class="mt-1 text-sm font-semibold text-slate-950 dark:text-white">Transaction Command Center</p>
              </div>
              <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Operational</span>
            </div>
            <div class="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
              <div class="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                <div class="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Pipeline stage</span>
                  <span>5 active deals</span>
                </div>
                <div class="grid gap-2">
                  <div class="h-2 rounded-full bg-blue-600"></div>
                  <div class="h-2 rounded-full bg-blue-400"></div>
                  <div class="h-2 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                </div>
                <div class="grid grid-cols-3 gap-2 pt-1 text-xs">
                  <span class="rounded-xl bg-white px-3 py-2 font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">Offer</span>
                  <span class="rounded-xl bg-white px-3 py-2 font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">Contract</span>
                  <span class="rounded-xl bg-white px-3 py-2 font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">Closing</span>
                </div>
              </div>
              <div class="grid gap-3">
                <div class="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/70">
                  <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Commission pipeline</p>
                  <p class="mt-2 text-xl font-semibold text-slate-950 dark:text-white">$128k</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/70">
                  <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Overdue tasks</p>
                  <p class="mt-2 text-xl font-semibold text-slate-950 dark:text-white">3</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <article class="rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-2xl shadow-blue-950/15 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:p-6">
          <div v-if="!showForgotPassword" class="space-y-5">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">Secure access</p>
              <h2 class="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                {{ mode === 'login' ? 'Welcome back' : 'Create your workspace' }}
              </h2>
              <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {{ mode === 'login' ? 'Sign in to continue managing transactions, tasks, inventory, and balances.' : 'Public registration is for the first workspace owner. Team members are created inside the app.' }}
              </p>
            </div>

            <div class="grid rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-950">
              <div class="grid" :class="registrationEnabled ? 'grid-cols-2' : 'grid-cols-1'">
                <button type="button" class="rounded-xl px-3 py-2 text-sm font-semibold transition-colors" :class="mode === 'login' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'" @click="switchMode('login')">
                  {{ t('auth.actions.login') }}
                </button>
                <button v-if="registrationEnabled" type="button" class="rounded-xl px-3 py-2 text-sm font-semibold transition-colors" :class="mode === 'register' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'" @click="switchMode('register')">
                  {{ t('auth.actions.register') }}
                </button>
              </div>
            </div>

            <div v-if="authStore.error" class="alert-error">
              {{ authStore.error }}
            </div>
            <div v-else-if="authHint" class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              {{ authHint }}
            </div>
            <div v-else-if="mode === 'register'" class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              Public registration creates the initial office owner workspace. Existing teams are managed from Team after sign-in.
            </div>

            <form v-if="mode === 'login'" class="space-y-4" @submit.prevent="onLogin">
              <label class="block">
                <span class="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('auth.fields.email') }}</span>
                <input v-model="loginForm.email" type="email" class="input-base shadow-sm" :placeholder="t('auth.placeholders.email')" :disabled="isSubmitting" required />
              </label>

              <label class="block">
                <span class="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Password</span>
                <input v-model="loginForm.password" type="password" class="input-base shadow-sm" :disabled="isSubmitting" autocomplete="current-password" required />
              </label>

              <label v-if="loginTwoFactorRequired" class="block">
                <span class="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {{ loginTwoFactorMethod === 'authenticator' ? 'Authenticator Code' : 'SMS Code' }}
                </span>
                <input v-model="loginForm.twoFactorCode" type="text" inputmode="numeric" maxlength="6" class="input-base shadow-sm" :disabled="isSubmitting" placeholder="6-digit code" required />
              </label>

              <button type="submit" class="inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-300" :disabled="isSubmitting">
                {{ authStore.isLoggingIn ? t('auth.actions.loggingIn') : t('auth.actions.login') }}
              </button>

              <button type="button" class="w-full rounded-xl px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 hover:text-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/40" :disabled="isSubmitting" @click="openForgotPassword">Forgot password?</button>
            </form>

            <form v-else-if="registrationEnabled" class="space-y-4" @submit.prevent="onRegister">
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="block">
                  <span class="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('auth.fields.name') }}</span>
                  <input v-model="registerForm.name" type="text" class="input-base shadow-sm" :placeholder="t('auth.placeholders.name')" :disabled="isSubmitting" required />
                </label>

                <label class="block">
                  <span class="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('auth.fields.email') }}</span>
                  <input v-model="registerForm.email" type="email" class="input-base shadow-sm" :placeholder="t('auth.placeholders.email')" :disabled="isSubmitting" required />
                </label>
              </div>

              <label class="block">
                <span class="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Organization Name</span>
                <input v-model="registerForm.organizationName" type="text" class="input-base shadow-sm" placeholder="Kalkan Estate" :disabled="isSubmitting" required />
              </label>

              <label class="block">
                <span class="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Organization Slug</span>
                <input v-model="registerForm.organizationSlug" type="text" class="input-base shadow-sm" placeholder="kalkan-estate-veli-2026" :disabled="isSubmitting" required />
              </label>

              <div class="grid gap-4 sm:grid-cols-2">
                <label class="block">
                  <span class="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Password</span>
                  <input v-model="registerForm.password" type="password" class="input-base shadow-sm" :disabled="isSubmitting" autocomplete="new-password" required />
                </label>

                <label class="block">
                  <span class="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Confirm Password</span>
                  <input v-model="registerForm.confirmPassword" type="password" class="input-base shadow-sm" :disabled="isSubmitting" autocomplete="new-password" required />
                </label>
              </div>

              <button type="submit" class="inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-300" :disabled="isSubmitting">
                {{ authStore.isRegistering ? t('auth.actions.registering') : t('auth.actions.register') }}
              </button>
            </form>
          </div>

          <div v-else class="space-y-5">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">Account recovery</p>
                <h2 class="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Reset password</h2>
                <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Use a verification code to securely regain access to your workspace.</p>
              </div>
              <button type="button" class="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white" :disabled="isSubmitting" @click="closeForgotPassword">Back</button>
            </div>

            <div v-if="forgotError" class="alert-error">
              {{ forgotError }}
            </div>
            <div v-else-if="forgotSuccess" class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              {{ forgotSuccess }}
            </div>

            <form v-if="forgotStep === 'request'" class="space-y-4" @submit.prevent="onRequestResetCode">
              <label class="block">
                <span class="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">E-mail</span>
                <input v-model="forgotForm.email" type="email" class="input-base shadow-sm" placeholder="you@example.com" :disabled="isSubmitting" required />
              </label>
              <button type="submit" class="inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-300" :disabled="isSubmitting">Send verification code</button>
            </form>

            <form v-else class="space-y-4" @submit.prevent="onResetPasswordWithCode">
              <label class="block">
                <span class="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Verification Code</span>
                <input v-model="forgotForm.code" type="text" inputmode="numeric" maxlength="6" class="input-base shadow-sm" placeholder="6-digit code" :disabled="isSubmitting" required />
              </label>

              <label class="block">
                <span class="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">New Password</span>
                <input v-model="forgotForm.newPassword" type="password" class="input-base shadow-sm" autocomplete="new-password" :disabled="isSubmitting" required />
              </label>

              <label class="block">
                <span class="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Confirm New Password</span>
                <input v-model="forgotForm.confirmNewPassword" type="password" class="input-base shadow-sm" autocomplete="new-password" :disabled="isSubmitting" required />
              </label>

              <button type="submit" class="inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-300" :disabled="isSubmitting">Reset password</button>
            </form>
          </div>
        </article>
      </div>
    </section>

    <section class="space-y-8">
      <div class="max-w-3xl">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">Platform value</p>
        <h2 class="mt-3 text-3xl font-semibold text-slate-950 dark:text-white sm:text-4xl">Built for the real estate transaction office.</h2>
        <p class="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">A focused operating layer for teams that need cleaner stage control, client context, property visibility, and financial clarity.</p>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MarketingFeatureCard v-for="feature in productFeatures" :key="feature.title" :eyebrow="feature.eyebrow" :title="feature.title" :description="feature.description" :metric="feature.metric" />
      </div>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
      <div class="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">Workflow</p>
          <h2 class="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">From workspace setup to operational control.</h2>
          <p class="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">The public page starts the workspace. The authenticated app handles team creation, permissions, transaction activity, and reporting.</p>
        </div>

        <div class="grid gap-4">
          <MarketingStepCard v-for="step in workflowSteps" :key="step.step" :step="step.step" :title="step.title" :description="step.description" />
        </div>
      </div>
    </section>
  </section>
</template>
