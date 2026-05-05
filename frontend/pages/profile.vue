<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import { useAppI18n } from '~/composables/useAppI18n';
import { toApiErrorMessage } from '~/services/api.errors';
import { useAgentsApi } from '~/services/agents.api';
import { useAuthStore } from '~/stores/auth';

type TwoFactorMethod = 'sms' | 'authenticator';

const authStore = useAuthStore();
const agentsApi = useAgentsApi();
const { formatDateTime } = useAppI18n();

useHead(() => ({
  title: 'Profile'
}));

const profileForm = reactive({
  name: '',
  email: '',
  phone: '',
  iban: ''
});

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: ''
});

const twoFactorMethod = ref<TwoFactorMethod>('authenticator');
const twoFactorSecret = ref<string | null>(null);
const twoFactorOtpAuthUrl = ref<string | null>(null);
const twoFactorCode = ref('');

const sessions = ref<
  Array<{
    id: string;
    device: string;
    location: string;
    userAgent: string;
    createdAt: string;
    lastActiveAt: string;
    current: boolean;
  }>
>([]);
const currentSessionId = ref<string | null>(null);

const isLoadingProfile = ref(false);
const isSavingProfile = ref(false);
const isChangingPassword = ref(false);
const isSettingUpTwoFactor = ref(false);
const isVerifyingTwoFactor = ref(false);
const isDisablingTwoFactor = ref(false);
const isLoadingSessions = ref(false);

const profileSuccess = ref<string | null>(null);
const passwordSuccess = ref<string | null>(null);
const twoFactorSuccess = ref<string | null>(null);
const sessionsSuccess = ref<string | null>(null);
const profileError = ref<string | null>(null);
const passwordError = ref<string | null>(null);
const twoFactorError = ref<string | null>(null);
const sessionsError = ref<string | null>(null);

const currentUserName = computed(() => authStore.currentUser?.name ?? '');
const currentUserEmail = computed(() => authStore.currentUser?.email ?? '');
const currentOrganizationName = computed(
  () => authStore.currentUser?.organization?.name ?? 'No organization assigned'
);
const currentOrganizationSlug = computed(() => authStore.currentUser?.organization?.slug ?? 'Not available');
const currentRoleLabel = computed(() => formatRoleLabel(authStore.currentUser?.role ?? null));
const hasSession = computed(() => Boolean(authStore.sessionToken));
const twoFactorEnabled = computed(() => Boolean(authStore.currentUser?.twoFactorEnabled));
const twoFactorVerifiedAt = computed(() => authStore.currentUser?.twoFactorVerifiedAt ?? null);

const formatRoleLabel = (role: string | null): string => {
  if (!role) {
    return 'No role';
  }

  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const clearMessages = () => {
  profileSuccess.value = null;
  passwordSuccess.value = null;
  twoFactorSuccess.value = null;
  sessionsSuccess.value = null;
  profileError.value = null;
  passwordError.value = null;
  twoFactorError.value = null;
  sessionsError.value = null;
};

const requireSessionToken = (): string => {
  const token = authStore.sessionToken?.trim() ?? '';
  if (!token) {
    throw new Error('Session token not found. Please sign in again.');
  }
  return token;
};

const applyProfile = (user: {
  name: string;
  email: string;
  phone?: string;
  iban?: string;
  twoFactorMethod?: TwoFactorMethod;
}) => {
  profileForm.name = user.name;
  profileForm.email = user.email;
  profileForm.phone = user.phone ?? '';
  profileForm.iban = user.iban ?? '';
  twoFactorMethod.value = user.twoFactorMethod === 'sms' ? 'sms' : 'authenticator';
};

const loadProfile = async () => {
  isLoadingProfile.value = true;
  profileError.value = null;

  try {
    const sessionToken = requireSessionToken();
    const user = await agentsApi.getMyProfile(sessionToken);
    applyProfile(user);
    authStore.currentUser = user;
  } catch (error: unknown) {
    profileError.value = toApiErrorMessage(error);
  } finally {
    isLoadingProfile.value = false;
  }
};

const saveProfile = async () => {
  isSavingProfile.value = true;
  profileSuccess.value = null;
  profileError.value = null;

  try {
    const sessionToken = requireSessionToken();
    const user = await agentsApi.updateMyProfile(sessionToken, {
      name: profileForm.name.trim(),
      email: profileForm.email.trim().toLowerCase(),
      phone: profileForm.phone.trim(),
      iban: profileForm.iban.trim()
    });

    authStore.currentUser = user;
    profileSuccess.value = 'Profile updated successfully.';
  } catch (error: unknown) {
    profileError.value = toApiErrorMessage(error);
  } finally {
    isSavingProfile.value = false;
  }
};

const changePassword = async () => {
  isChangingPassword.value = true;
  passwordSuccess.value = null;
  passwordError.value = null;

  try {
    const sessionToken = requireSessionToken();
    await agentsApi.changeMyPassword(sessionToken, {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmNewPassword: passwordForm.confirmNewPassword
    });
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmNewPassword = '';
    passwordSuccess.value = 'Password changed successfully.';
  } catch (error: unknown) {
    passwordError.value = toApiErrorMessage(error);
  } finally {
    isChangingPassword.value = false;
  }
};

const setupTwoFactor = async () => {
  isSettingUpTwoFactor.value = true;
  twoFactorSuccess.value = null;
  twoFactorError.value = null;

  try {
    const sessionToken = requireSessionToken();
    const result = await agentsApi.setupMyTwoFactor(sessionToken, {
      method: twoFactorMethod.value
    });
    twoFactorSecret.value = result.secret;
    twoFactorOtpAuthUrl.value = result.otpauthUrl;
    twoFactorCode.value = '';
    twoFactorSuccess.value =
      '2FA secret generated. Scan this key in your authenticator app and verify with a 6-digit code.';
  } catch (error: unknown) {
    twoFactorError.value = toApiErrorMessage(error);
  } finally {
    isSettingUpTwoFactor.value = false;
  }
};

const verifyTwoFactor = async () => {
  isVerifyingTwoFactor.value = true;
  twoFactorSuccess.value = null;
  twoFactorError.value = null;

  try {
    const sessionToken = requireSessionToken();
    const result = await agentsApi.verifyMyTwoFactor(sessionToken, {
      code: twoFactorCode.value.trim()
    });

    twoFactorCode.value = '';
    twoFactorSecret.value = null;
    twoFactorOtpAuthUrl.value = null;
    twoFactorSuccess.value = `2FA enabled at ${formatDateTime(result.verifiedAt)}.`;
    await loadProfile();
  } catch (error: unknown) {
    twoFactorError.value = toApiErrorMessage(error);
  } finally {
    isVerifyingTwoFactor.value = false;
  }
};

const disableTwoFactor = async () => {
  isDisablingTwoFactor.value = true;
  twoFactorSuccess.value = null;
  twoFactorError.value = null;

  try {
    const sessionToken = requireSessionToken();
    await agentsApi.disableMyTwoFactor(sessionToken);
    twoFactorCode.value = '';
    twoFactorSecret.value = null;
    twoFactorOtpAuthUrl.value = null;
    twoFactorSuccess.value = '2FA disabled successfully.';
    await loadProfile();
  } catch (error: unknown) {
    twoFactorError.value = toApiErrorMessage(error);
  } finally {
    isDisablingTwoFactor.value = false;
  }
};

const loadSessions = async () => {
  isLoadingSessions.value = true;
  sessionsError.value = null;

  try {
    const sessionToken = requireSessionToken();
    const result = await agentsApi.listMySessions(sessionToken);
    currentSessionId.value = result.currentSessionId;
    sessions.value = result.sessions;
  } catch (error: unknown) {
    sessionsError.value = toApiErrorMessage(error);
  } finally {
    isLoadingSessions.value = false;
  }
};

const revokeSession = async (sessionId: string) => {
  sessionsSuccess.value = null;
  sessionsError.value = null;

  try {
    const sessionToken = requireSessionToken();
    await agentsApi.revokeMySession(sessionToken, sessionId);
    sessionsSuccess.value = 'Session revoked successfully.';
    await loadSessions();
  } catch (error: unknown) {
    sessionsError.value = toApiErrorMessage(error);
  }
};

const revokeOtherSessions = async () => {
  sessionsSuccess.value = null;
  sessionsError.value = null;

  try {
    const sessionToken = requireSessionToken();
    await agentsApi.revokeMyOtherSessions(sessionToken);
    sessionsSuccess.value = 'All other sessions were revoked.';
    await loadSessions();
  } catch (error: unknown) {
    sessionsError.value = toApiErrorMessage(error);
  }
};

onMounted(async () => {
  authStore.hydrateFromStorage();
  clearMessages();

  if (!hasSession.value) {
    profileError.value = 'You need to sign in again to manage profile and security settings.';
    return;
  }

  await Promise.all([loadProfile(), loadSessions()]);
});
</script>

<template>
  <section class="space-y-6">
    <header class="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900 sm:p-7">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">User Profile</p>
      <h1 class="mt-2 text-3xl font-semibold sm:text-4xl">Profile</h1>
      <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
        Manage your account details, security settings, and active sessions.
      </p>
      <p v-if="currentUserName" class="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Signed in as
        <span class="font-semibold text-slate-700 dark:text-slate-200">{{ currentUserName }}</span>
        <span v-if="currentUserEmail">({{ currentUserEmail }})</span>
      </p>
    </header>

    <article class="panel">
      <div class="panel-body space-y-4">
        <div>
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Organization</h2>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Your current workspace and access level for this session.
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3">
          <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
            <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Organization
            </p>
            <p class="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {{ currentOrganizationName }}
            </p>
          </div>
          <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
            <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Slug
            </p>
            <p class="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {{ currentOrganizationSlug }}
            </p>
          </div>
          <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
            <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Role
            </p>
            <p class="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {{ currentRoleLabel }}
            </p>
          </div>
        </div>
      </div>
    </article>

    <article class="panel">
      <div class="panel-body space-y-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Profile Information</h2>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Update your account details, email address, phone number, and IBAN.
            </p>
          </div>
          <button type="button" class="btn-primary" :disabled="isSavingProfile || isLoadingProfile" @click="saveProfile">
            Save Profile
          </button>
        </div>

        <div v-if="profileError" class="alert-error">{{ profileError }}</div>
        <div
          v-else-if="profileSuccess"
          class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          {{ profileSuccess }}
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <label class="block">
            <span class="field-label">Full Name</span>
            <input v-model="profileForm.name" type="text" class="input-base" />
          </label>
          <label class="block">
            <span class="field-label">Email</span>
            <input v-model="profileForm.email" type="email" class="input-base" />
          </label>
          <label class="block">
            <span class="field-label">Phone Number</span>
            <input v-model="profileForm.phone" type="tel" class="input-base" />
          </label>
          <label class="block">
            <span class="field-label">IBAN</span>
            <input v-model="profileForm.iban" type="text" class="input-base" />
          </label>
        </div>
      </div>
    </article>

    <div class="grid gap-4 xl:grid-cols-2">
      <article class="panel">
        <div class="panel-body space-y-5">
          <div>
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Change Password</h2>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Update your password by entering your current password and confirming the new one.
            </p>
          </div>

          <div class="space-y-3">
            <label class="block">
              <span class="field-label">Current Password</span>
              <input v-model="passwordForm.currentPassword" type="password" class="input-base" />
            </label>
            <label class="block">
              <span class="field-label">New Password</span>
              <input v-model="passwordForm.newPassword" type="password" class="input-base" />
            </label>
            <label class="block">
              <span class="field-label">Confirm New Password</span>
              <input v-model="passwordForm.confirmNewPassword" type="password" class="input-base" />
            </label>
          </div>

          <div v-if="passwordError" class="alert-error">{{ passwordError }}</div>
          <div
            v-else-if="passwordSuccess"
            class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            {{ passwordSuccess }}
          </div>

          <button type="button" class="btn-primary" :disabled="isChangingPassword" @click="changePassword">
            {{ isChangingPassword ? 'Updating...' : 'Update Password' }}
          </button>
        </div>
      </article>

      <article class="panel">
        <div class="panel-body space-y-5">
          <div>
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Two-Factor Authentication (2FA)</h2>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Add an extra security layer to sign-in with authenticator-based 2FA.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span class="status-chip">2FA: {{ twoFactorEnabled ? 'Enabled' : 'Disabled' }}</span>
            <span v-if="twoFactorVerifiedAt" class="status-chip">
              Verified: {{ formatDateTime(twoFactorVerifiedAt) }}
            </span>
          </div>

          <label class="block">
            <span class="field-label">2FA Method</span>
            <select v-model="twoFactorMethod" class="input-base" :disabled="twoFactorEnabled">
              <option value="authenticator">Authenticator App</option>
              <option value="sms">SMS (requires provider)</option>
            </select>
          </label>

          <div v-if="twoFactorSecret" class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/60">
            <p class="font-semibold text-slate-700 dark:text-slate-200">Authenticator Secret</p>
            <p class="mt-1 font-mono text-slate-600 dark:text-slate-300">{{ twoFactorSecret }}</p>
            <p v-if="twoFactorOtpAuthUrl" class="mt-2 break-all text-slate-500 dark:text-slate-400">
              {{ twoFactorOtpAuthUrl }}
            </p>
          </div>

          <label class="block">
            <span class="field-label">2FA Verification Code</span>
            <input
              v-model="twoFactorCode"
              type="text"
              inputmode="numeric"
              maxlength="6"
              class="input-base"
              placeholder="6-digit code"
            />
          </label>

          <div v-if="twoFactorError" class="alert-error">{{ twoFactorError }}</div>
          <div
            v-else-if="twoFactorSuccess"
            class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            {{ twoFactorSuccess }}
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn-secondary" :disabled="isSettingUpTwoFactor" @click="setupTwoFactor">
              {{ isSettingUpTwoFactor ? 'Preparing...' : 'Start 2FA Setup' }}
            </button>
            <button
              type="button"
              class="btn-primary"
              :disabled="isVerifyingTwoFactor || twoFactorCode.trim().length !== 6"
              @click="verifyTwoFactor"
            >
              {{ isVerifyingTwoFactor ? 'Verifying...' : 'Verify 2FA' }}
            </button>
            <button
              v-if="twoFactorEnabled"
              type="button"
              class="btn-secondary"
              :disabled="isDisablingTwoFactor"
              @click="disableTwoFactor"
            >
              {{ isDisablingTwoFactor ? 'Disabling...' : 'Disable 2FA' }}
            </button>
          </div>
        </div>
      </article>
    </div>

    <article class="panel">
      <div class="panel-body space-y-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Session Management</h2>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              View active sessions and sign out from other devices.
            </p>
          </div>
          <button type="button" class="btn-secondary" :disabled="isLoadingSessions" @click="revokeOtherSessions">
            Sign Out Other Devices
          </button>
        </div>

        <div v-if="sessionsError" class="alert-error">{{ sessionsError }}</div>
        <div
          v-else-if="sessionsSuccess"
          class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          {{ sessionsSuccess }}
        </div>

        <div v-if="sessions.length === 0" class="empty-state">
          <h4 class="text-base font-semibold text-slate-800 dark:text-slate-100">No active sessions</h4>
        </div>

        <div v-else class="space-y-3">
          <article
            v-for="session in sessions"
            :key="session.id"
            class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ session.device }}</p>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ session.location }}</p>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ session.userAgent }}</p>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Last active: {{ formatDateTime(session.lastActiveAt) }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <span class="status-chip">{{ session.current ? 'Current Session' : 'Active' }}</span>
                <button
                  v-if="!session.current"
                  type="button"
                  class="btn-secondary"
                  @click="revokeSession(session.id)"
                >
                  Revoke Session
                </button>
              </div>
            </div>
          </article>
        </div>

        <p v-if="currentSessionId" class="text-xs text-slate-500 dark:text-slate-400">
          Current session ID: <span class="font-mono">{{ currentSessionId }}</span>
        </p>
      </div>
    </article>

  </section>
</template>
