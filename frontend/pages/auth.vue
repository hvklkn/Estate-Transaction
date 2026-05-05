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

const isSubmitting = computed(
  () => authStore.isLoggingIn || authStore.isRegistering || isForgotSubmitting.value
);
const registrationEnabled = computed(
  () => String(config.public.registrationEnabled ?? 'true').toLowerCase() !== 'false'
);

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
    authHint.value =
      loginTwoFactorMethod.value === 'authenticator'
        ? 'Enter the 6-digit code from your authenticator app.'
        : 'Enter the 6-digit SMS verification code.';
    return;
  }

  loginTwoFactorRequired.value = false;
  loginForm.twoFactorCode = '';
  const onRegister = async () => {
    authHint.value = null;
    authStore.setError(null);

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

    if (!authStore.error) {
      await navigateTo('/transactions');
    }
  };
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
  <section class="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr,1fr]">
    <article class="panel">
      <div class="panel-body space-y-4">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
          {{ t('auth.hero.kicker') }}
        </p>
        <h1 class="text-3xl font-semibold text-slate-900 sm:text-4xl">
          {{ t('auth.hero.title') }}
        </h1>
        <p class="text-sm leading-6 text-slate-600">
          {{ t('auth.hero.description') }}
        </p>

        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {{ t('auth.hero.notesTitle') }}
          </p>
          <ul class="mt-3 space-y-2 text-sm text-slate-600">
            <li>{{ t('auth.hero.noteOne') }}</li>
            <li>{{ t('auth.hero.noteTwo') }}</li>
            <li>{{ t('auth.hero.noteThree') }}</li>
          </ul>
        </div>
      </div>
    </article>

    <article class="panel">
      <div class="panel-body space-y-5">
        <div
          v-if="!showForgotPassword"
          class="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1"
        >
          <button
            v-if="registrationEnabled"
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium"
            :class="mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'"
            @click="switchMode('login')"
          >
            {{ t('auth.actions.login') }}
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium"
            :class="mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'"
            @click="switchMode('register')"
          >
            {{ t('auth.actions.register') }}
          </button>
        </div>

        <template v-if="!showForgotPassword">
          <div v-if="authStore.error" class="alert-error">
            {{ authStore.error }}
          </div>
          <div
            v-else-if="authHint"
            class="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
          >
            {{ authHint }}
          </div>

          <form v-if="mode === 'login'" class="space-y-4" @submit.prevent="onLogin">
            <label class="block">
              <span class="field-label">{{ t('auth.fields.email') }}</span>
              <input
                v-model="loginForm.email"
                type="email"
                class="input-base"
                :placeholder="t('auth.placeholders.email')"
                :disabled="isSubmitting"
                required
              />
            </label>

            

            <label class="block">
              <span class="field-label">Password</span>
              <input
                v-model="loginForm.password"
                type="password"
                class="input-base"
                :disabled="isSubmitting"
                autocomplete="current-password"
                required
              />
            </label>

            <label v-if="loginTwoFactorRequired" class="block">
              <span class="field-label">
                {{ loginTwoFactorMethod === 'authenticator' ? 'Authenticator Code' : 'SMS Code' }}
              </span>
              <input
                v-model="loginForm.twoFactorCode"
                type="text"
                inputmode="numeric"
                maxlength="6"
                class="input-base"
                :disabled="isSubmitting"
                placeholder="6-digit code"
                required
              />
            </label>

            <button type="submit" class="btn-primary w-full" :disabled="isSubmitting">
              {{ authStore.isLoggingIn ? t('auth.actions.loggingIn') : t('auth.actions.login') }}
            </button>

            <button
              type="button"
              class="w-full text-sm font-medium text-brand-700 hover:text-brand-800"
              :disabled="isSubmitting"
              @click="openForgotPassword"
            >
              Forgot Password?
            </button>
          </form>

          <form v-else-if="registrationEnabled" class="space-y-4" @submit.prevent="onRegister">
            <label class="block">
              <span class="field-label">{{ t('auth.fields.name') }}</span>
              <input
                v-model="registerForm.name"
                type="text"
                class="input-base"
                :placeholder="t('auth.placeholders.name')"
                :disabled="isSubmitting"
                required
              />
            </label>

            <label class="block">
              <span class="field-label">{{ t('auth.fields.email') }}</span>
              <input
                v-model="registerForm.email"
                type="email"
                class="input-base"
                :placeholder="t('auth.placeholders.email')"
                :disabled="isSubmitting"
                required
              />
            </label>
            <label class="block">
              <span class="field-label">Organization Name</span>
              <input
                v-model="registerForm.organizationName"
                type="text"
                class="input-base"
                placeholder="Kalkan Estate"
                :disabled="isSubmitting"
                required
              />
            </label>

            <label class="block">
              <span class="field-label">Organization Slug</span>
              <input
                v-model="registerForm.organizationSlug"
                type="text"
                class="input-base"
                placeholder="kalkan-estate-veli-2026"
                :disabled="isSubmitting"
                required
              />
            </label>            

            <label class="block">
              <span class="field-label">Password</span>
              <input
                v-model="registerForm.password"
                type="password"
                class="input-base"
                :disabled="isSubmitting"
                autocomplete="new-password"
                required
              />
            </label>

            <label class="block">
              <span class="field-label">Confirm Password</span>
              <input
                v-model="registerForm.confirmPassword"
                type="password"
                class="input-base"
                :disabled="isSubmitting"
                autocomplete="new-password"
                required
              />
            </label>

            <button type="submit" class="btn-primary w-full" :disabled="isSubmitting">
              {{
                authStore.isRegistering ? t('auth.actions.registering') : t('auth.actions.register')
              }}
            </button>
          </form>
        </template>

        <template v-else>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Reset Password</h2>
            <button
              type="button"
              class="text-sm font-medium text-slate-600 hover:text-slate-900"
              :disabled="isSubmitting"
              @click="closeForgotPassword"
            >
              Back
            </button>
          </div>

          <div v-if="forgotError" class="alert-error">
            {{ forgotError }}
          </div>
          <div
            v-else-if="forgotSuccess"
            class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          >
            {{ forgotSuccess }}
          </div>

          <form v-if="forgotStep === 'request'" class="space-y-4" @submit.prevent="onRequestResetCode">
            <label class="block">
              <span class="field-label">E-mail</span>
              <input
                v-model="forgotForm.email"
                type="email"
                class="input-base"
                placeholder="you@example.com"
                :disabled="isSubmitting"
                required
              />
            </label>
            <button type="submit" class="btn-primary w-full" :disabled="isSubmitting">
              Send Verification Code
            </button>
          </form>

          <form v-else class="space-y-4" @submit.prevent="onResetPasswordWithCode">
            <label class="block">
              <span class="field-label">Verification Code</span>
              <input
                v-model="forgotForm.code"
                type="text"
                inputmode="numeric"
                maxlength="6"
                class="input-base"
                placeholder="6-digit code"
                :disabled="isSubmitting"
                required
              />
            </label>

            <label class="block">
              <span class="field-label">New Password</span>
              <input
                v-model="forgotForm.newPassword"
                type="password"
                class="input-base"
                autocomplete="new-password"
                :disabled="isSubmitting"
                required
              />
            </label>

            <label class="block">
              <span class="field-label">Confirm New Password</span>
              <input
                v-model="forgotForm.confirmNewPassword"
                type="password"
                class="input-base"
                autocomplete="new-password"
                :disabled="isSubmitting"
                required
              />
            </label>

            <button type="submit" class="btn-primary w-full" :disabled="isSubmitting">
              Reset Password
            </button>
          </form>
        </template>
      </div>
    </article>
  </section>
</template>
