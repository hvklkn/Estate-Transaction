<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useAppI18n } from '~/composables/useAppI18n';
import { useUserSettings } from '~/composables/useUserSettings';
import { useAuthStore } from '~/stores/auth';

const PROFILE_STORAGE_KEY = 'iceberg.profile-settings';

type ProfileField = 'name' | 'email' | 'phone' | 'iban';

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  iban: string;
};

type ProfileVerification = Record<ProfileField, boolean>;

const { t } = useAppI18n();
const { settings, hydrateFromStorage } = useUserSettings();
const authStore = useAuthStore();
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

const profile = reactive<ProfileForm>({
  name: '',
  email: '',
  phone: '',
  iban: ''
});

const verification = reactive<ProfileVerification>({
  name: false,
  email: false,
  phone: false,
  iban: false
});

const smsCodeInput = ref('');
const generatedSmsCode = ref<string | null>(null);
const smsFeedback = ref<'idle' | 'sent' | 'invalid' | 'verified'>('idle');

const hasPhoneValue = computed(() => profile.phone.trim().length > 0);

useHead(() => ({
  title: t('settings.meta.title')
}));

const setTheme = (mode: 'light' | 'dark') => {
  colorMode.value = mode;
};

const statusLabel = (isVerified: boolean): string =>
  isVerified ? t('settings.profile.status.verified') : t('settings.profile.status.pending');

const statusChipClasses = (isVerified: boolean): string =>
  isVerified
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
    : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300';

const markFieldPending = (field: ProfileField) => {
  verification[field] = false;

  if (field === 'phone') {
    generatedSmsCode.value = null;
    smsCodeInput.value = '';
    smsFeedback.value = 'idle';
  }
};

const markFieldVerified = (field: Exclude<ProfileField, 'phone'>) => {
  if (!profile[field].trim()) {
    return;
  }

  verification[field] = true;
};

const sendSmsCode = () => {
  if (!hasPhoneValue.value) {
    return;
  }

  generatedSmsCode.value = String(Math.floor(100000 + Math.random() * 900000));
  smsCodeInput.value = '';
  smsFeedback.value = 'sent';
  verification.phone = false;
};

const verifyPhoneSms = () => {
  if (!generatedSmsCode.value) {
    return;
  }

  if (smsCodeInput.value.trim() !== generatedSmsCode.value) {
    smsFeedback.value = 'invalid';
    verification.phone = false;
    return;
  }

  verification.phone = true;
  smsFeedback.value = 'verified';
  generatedSmsCode.value = null;
  smsCodeInput.value = '';
};

const hydrateProfileFromStorage = () => {
  if (!import.meta.client) {
    return;
  }

  const rawProfileData = window.localStorage.getItem(PROFILE_STORAGE_KEY);

  if (!rawProfileData) {
    return;
  }

  try {
    const parsedData = JSON.parse(rawProfileData) as {
      profile?: Partial<ProfileForm>;
      verification?: Partial<ProfileVerification>;
    };

    const storedProfile = parsedData.profile ?? {};
    const storedVerification = parsedData.verification ?? {};

    profile.name = typeof storedProfile.name === 'string' ? storedProfile.name : profile.name;
    profile.email = typeof storedProfile.email === 'string' ? storedProfile.email : profile.email;
    profile.phone = typeof storedProfile.phone === 'string' ? storedProfile.phone : profile.phone;
    profile.iban = typeof storedProfile.iban === 'string' ? storedProfile.iban : profile.iban;

    verification.name = Boolean(storedVerification.name);
    verification.email = Boolean(storedVerification.email);
    verification.phone = Boolean(storedVerification.phone);
    verification.iban = Boolean(storedVerification.iban);
  } catch {
    // Ignore malformed local data and continue with defaults.
  }
};

const hydrateProfileFromCurrentUser = () => {
  const currentUser = authStore.currentUser;

  if (!currentUser) {
    return;
  }

  if (!profile.name.trim()) {
    profile.name = currentUser.name;
    verification.name = true;
  }

  if (!profile.email.trim()) {
    profile.email = currentUser.email;
    verification.email = true;
  }
};

watch(
  () => ({
    profile: { ...profile },
    verification: { ...verification }
  }),
  (nextData) => {
    if (!import.meta.client) {
      return;
    }

    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextData));
  },
  { deep: true }
);

watch(
  () => authStore.currentUser,
  () => {
    hydrateProfileFromCurrentUser();
  }
);

onMounted(() => {
  authStore.hydrateFromStorage();
  hydrateFromStorage();
  hydrateProfileFromStorage();
  hydrateProfileFromCurrentUser();
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

    <article class="panel">
      <div class="panel-body space-y-5">
        <div>
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('settings.profile.title') }}</h2>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ t('settings.profile.description') }}</p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <label class="block">
            <div class="mb-1 flex items-center justify-between gap-2">
              <span class="field-label mb-0">{{ t('settings.profile.fields.name') }}</span>
              <span class="status-chip text-[11px]" :class="statusChipClasses(verification.name)">
                {{ statusLabel(verification.name) }}
              </span>
            </div>
            <div class="flex gap-2">
              <input
                v-model="profile.name"
                type="text"
                class="input-base"
                :placeholder="t('settings.profile.placeholders.name')"
                @input="markFieldPending('name')"
              />
              <button type="button" class="btn-secondary whitespace-nowrap" @click="markFieldVerified('name')">
                {{ t('settings.profile.actions.verify') }}
              </button>
            </div>
          </label>

          <label class="block">
            <div class="mb-1 flex items-center justify-between gap-2">
              <span class="field-label mb-0">{{ t('settings.profile.fields.email') }}</span>
              <span class="status-chip text-[11px]" :class="statusChipClasses(verification.email)">
                {{ statusLabel(verification.email) }}
              </span>
            </div>
            <div class="flex gap-2">
              <input
                v-model="profile.email"
                type="email"
                class="input-base"
                :placeholder="t('settings.profile.placeholders.email')"
                @input="markFieldPending('email')"
              />
              <button type="button" class="btn-secondary whitespace-nowrap" @click="markFieldVerified('email')">
                {{ t('settings.profile.actions.verify') }}
              </button>
            </div>
          </label>

          <div class="block md:col-span-2">
            <div class="mb-1 flex items-center justify-between gap-2">
              <span class="field-label mb-0">{{ t('settings.profile.fields.phone') }}</span>
              <span class="status-chip text-[11px]" :class="statusChipClasses(verification.phone)">
                {{ statusLabel(verification.phone) }}
              </span>
            </div>
            <div class="grid gap-2 lg:grid-cols-[1fr,auto]">
              <input
                v-model="profile.phone"
                type="tel"
                class="input-base"
                :placeholder="t('settings.profile.placeholders.phone')"
                @input="markFieldPending('phone')"
              />
              <button type="button" class="btn-secondary" :disabled="!hasPhoneValue" @click="sendSmsCode">
                {{ t('settings.profile.actions.sendSms') }}
              </button>
            </div>

            <div v-if="smsFeedback === 'sent' || smsFeedback === 'invalid'" class="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
              <p class="text-xs font-medium text-slate-700 dark:text-slate-300">{{ t('settings.profile.sms.codeSent') }}</p>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {{ t('settings.profile.sms.demoCode') }}: <span class="font-mono">{{ generatedSmsCode }}</span>
              </p>
              <div class="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  v-model="smsCodeInput"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  class="input-base"
                  :placeholder="t('settings.profile.sms.codePlaceholder')"
                />
                <button type="button" class="btn-primary" @click="verifyPhoneSms">
                  {{ t('settings.profile.actions.confirmSms') }}
                </button>
              </div>
              <p v-if="smsFeedback === 'invalid'" class="mt-2 text-xs font-medium text-rose-700 dark:text-rose-300">
                {{ t('settings.profile.sms.invalidCode') }}
              </p>
            </div>

            <p v-if="smsFeedback === 'verified'" class="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              {{ t('settings.profile.sms.verified') }}
            </p>
          </div>

          <label class="block md:col-span-2">
            <div class="mb-1 flex items-center justify-between gap-2">
              <span class="field-label mb-0">{{ t('settings.profile.fields.iban') }}</span>
              <span class="status-chip text-[11px]" :class="statusChipClasses(verification.iban)">
                {{ statusLabel(verification.iban) }}
              </span>
            </div>
            <div class="flex gap-2">
              <input
                v-model="profile.iban"
                type="text"
                class="input-base"
                :placeholder="t('settings.profile.placeholders.iban')"
                @input="markFieldPending('iban')"
              />
              <button type="button" class="btn-secondary whitespace-nowrap" @click="markFieldVerified('iban')">
                {{ t('settings.profile.actions.verify') }}
              </button>
            </div>
          </label>
        </div>
      </div>
    </article>

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
