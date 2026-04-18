<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';

import { useAppI18n } from '~/composables/useAppI18n';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const { t } = useAppI18n();

useHead(() => ({
  title: t('auth.meta.title')
}));

const mode = ref<'login' | 'register'>('login');

const loginForm = reactive({
  email: ''
});

const registerForm = reactive({
  name: '',
  email: ''
});
const registerEmailCode = ref('');
const generatedRegisterCode = ref<string | null>(null);
const registerVerificationStatus = ref<'idle' | 'sent' | 'invalid' | 'verified'>('idle');
const verifiedRegisterEmail = ref<string | null>(null);

const isSubmitting = computed(() => authStore.isLoggingIn || authStore.isRegistering);
const normalizedRegisterEmail = computed(() => registerForm.email.trim().toLowerCase());
const canSendRegisterCode = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedRegisterEmail.value)
);
const isRegisterEmailVerified = computed(
  () =>
    Boolean(verifiedRegisterEmail.value) &&
    verifiedRegisterEmail.value === normalizedRegisterEmail.value
);

const onLogin = async () => {
  await authStore.login({
    email: loginForm.email.trim().toLowerCase()
  });

  await navigateTo('/transactions');
};

const onRegister = async () => {
  if (!isRegisterEmailVerified.value) {
    registerVerificationStatus.value = 'invalid';
    return;
  }

  await authStore.register({
    name: registerForm.name.trim(),
    email: normalizedRegisterEmail.value
  });

  await navigateTo('/transactions');
};

const sendRegisterVerificationCode = () => {
  if (!canSendRegisterCode.value) {
    return;
  }

  generatedRegisterCode.value = String(Math.floor(100000 + Math.random() * 900000));
  registerEmailCode.value = '';
  registerVerificationStatus.value = 'sent';
  verifiedRegisterEmail.value = null;
};

const verifyRegisterCode = () => {
  if (!generatedRegisterCode.value) {
    return;
  }

  if (registerEmailCode.value.trim() !== generatedRegisterCode.value) {
    registerVerificationStatus.value = 'invalid';
    verifiedRegisterEmail.value = null;
    return;
  }

  registerVerificationStatus.value = 'verified';
  verifiedRegisterEmail.value = normalizedRegisterEmail.value;
  generatedRegisterCode.value = null;
  registerEmailCode.value = '';
};

watch(
  () => normalizedRegisterEmail.value,
  (nextEmail, previousEmail) => {
    if (!nextEmail) {
      registerVerificationStatus.value = 'idle';
      generatedRegisterCode.value = null;
      registerEmailCode.value = '';
      verifiedRegisterEmail.value = null;
      return;
    }

    if (nextEmail !== previousEmail) {
      registerVerificationStatus.value = 'idle';
      generatedRegisterCode.value = null;
      registerEmailCode.value = '';
      verifiedRegisterEmail.value = null;
    }
  }
);
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
        <div class="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium"
            :class="mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'"
            @click="mode = 'login'"
          >
            {{ t('auth.actions.login') }}
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium"
            :class="mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'"
            @click="mode = 'register'"
          >
            {{ t('auth.actions.register') }}
          </button>
        </div>

        <div v-if="authStore.error" class="alert-error">
          {{ authStore.error }}
        </div>

        <form
          v-if="mode === 'login'"
          class="space-y-4"
          @submit.prevent="onLogin"
        >
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

          <button type="submit" class="btn-primary w-full" :disabled="isSubmitting">
            {{ authStore.isLoggingIn ? t('auth.actions.loggingIn') : t('auth.actions.login') }}
          </button>
        </form>

        <form
          v-else
          class="space-y-4"
          @submit.prevent="onRegister"
        >
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

          <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {{ t('auth.verification.emailTitle') }}
                </p>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {{ t('auth.verification.emailDescription') }}
                </p>
              </div>
              <span
                class="status-chip text-[11px]"
                :class="
                  isRegisterEmailVerified
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300'
                "
              >
                {{
                  isRegisterEmailVerified
                    ? t('auth.verification.statusVerified')
                    : t('auth.verification.statusPending')
                }}
              </span>
            </div>

            <div class="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                class="btn-secondary"
                :disabled="isSubmitting || !canSendRegisterCode"
                @click="sendRegisterVerificationCode"
              >
                {{
                  registerVerificationStatus === 'sent'
                    ? t('auth.verification.resendCode')
                    : t('auth.verification.sendCode')
                }}
              </button>
            </div>

            <div
              v-if="registerVerificationStatus === 'sent' || registerVerificationStatus === 'invalid'"
              class="mt-3 space-y-2"
            >
              <p class="text-xs text-slate-600 dark:text-slate-300">
                {{ t('auth.verification.codeSentInfo') }}
                <span class="font-mono">{{ generatedRegisterCode }}</span>
              </p>
              <div class="flex flex-col gap-2 sm:flex-row">
                <input
                  v-model="registerEmailCode"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  class="input-base"
                  :placeholder="t('auth.verification.codePlaceholder')"
                  :disabled="isSubmitting"
                />
                <button
                  type="button"
                  class="btn-primary"
                  :disabled="isSubmitting || registerEmailCode.trim().length !== 6"
                  @click="verifyRegisterCode"
                >
                  {{ t('auth.verification.verifyCode') }}
                </button>
              </div>
              <p
                v-if="registerVerificationStatus === 'invalid'"
                class="text-xs font-medium text-rose-700 dark:text-rose-300"
              >
                {{ t('auth.verification.invalidCode') }}
              </p>
            </div>
          </div>

          <p v-if="!isRegisterEmailVerified" class="text-xs text-amber-700 dark:text-amber-300">
            {{ t('auth.verification.requiredBeforeRegister') }}
          </p>

          <button
            type="submit"
            class="btn-primary w-full"
            :disabled="isSubmitting || !isRegisterEmailVerified"
          >
            {{ authStore.isRegistering ? t('auth.actions.registering') : t('auth.actions.register') }}
          </button>
        </form>
      </div>
    </article>
  </section>
</template>
