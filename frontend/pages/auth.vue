<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

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

const isSubmitting = computed(() => authStore.isLoggingIn || authStore.isRegistering);

const onLogin = async () => {
  await authStore.login({
    email: loginForm.email.trim().toLowerCase()
  });

  await navigateTo('/transactions');
};

const onRegister = async () => {
  await authStore.register({
    name: registerForm.name.trim(),
    email: registerForm.email.trim().toLowerCase()
  });

  await navigateTo('/transactions');
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

          <button type="submit" class="btn-primary w-full" :disabled="isSubmitting">
            {{ authStore.isRegistering ? t('auth.actions.registering') : t('auth.actions.register') }}
          </button>
        </form>
      </div>
    </article>
  </section>
</template>
