<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useAppI18n } from '~/composables/useAppI18n';
import { toApiErrorMessage } from '~/services/api.errors';
import { useAuthStore } from '~/stores/auth';
import type { AgentRole, AgentUser } from '~/types/agent';

const authStore = useAuthStore();
const { t } = useAppI18n();

useHead(() => ({ title: t('team.meta.title') }));

const SUPER_ADMIN_ASSIGNABLE_ROLES: AgentRole[] = [
  'super_admin',
  'office_owner',
  'admin',
  'manager',
  'agent',
  'assistant',
  'finance'
];
const TENANT_ADMIN_ASSIGNABLE_ROLES: AgentRole[] = [
  'office_owner',
  'admin',
  'manager',
  'agent',
  'assistant',
  'finance'
];
const MANAGER_ASSIGNABLE_ROLES: AgentRole[] = ['agent', 'assistant', 'finance'];

const form = reactive({
  name: '',
  email: '',
  password: '',
  role: 'agent' as AgentRole,
  isActive: true
});

const successMessage = ref('');
const pageError = ref<string | null>(null);

const currentOrganizationName = computed(
  () => authStore.currentOrganization?.name ?? authStore.currentUser?.organizationId ?? t('team.users.currentOrganization')
);
const currentRole = computed(() => authStore.currentUser?.role ?? null);
const canCreateTeamMembers = computed(() => authStore.canManageTeam);
const assignableRoleOptions = computed<Array<{ value: AgentRole; label: string }>>(() => {
  if (currentRole.value === 'super_admin') {
    return SUPER_ADMIN_ASSIGNABLE_ROLES.map((role) => ({
      value: role,
      label: t(`roles.${role}`)
    }));
  }

  if (currentRole.value === 'office_owner' || currentRole.value === 'admin') {
    return TENANT_ADMIN_ASSIGNABLE_ROLES.map((role) => ({
      value: role,
      label: t(`roles.${role}`)
    }));
  }

  if (currentRole.value === 'manager') {
    return MANAGER_ASSIGNABLE_ROLES.map((role) => ({
      value: role,
      label: t(`roles.${role}`)
    }));
  }

  return [];
});
const teamMembers = computed(() =>
  [...authStore.users].sort((left, right) => {
    if (left.isActive !== right.isActive) {
      return left.isActive ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  })
);
const canSubmit = computed(
  () =>
    canCreateTeamMembers.value &&
    form.name.trim().length >= 2 &&
    form.email.trim().length > 0 &&
    form.password.length >= 8 &&
    assignableRoleOptions.value.some((role) => role.value === form.role) &&
    !authStore.isCreatingUser
);

const formatRoleLabel = (role: AgentRole) => t(`roles.${role}`);

const organizationLabel = (user: AgentUser) => user.organization?.name ?? user.organizationId ?? t('team.users.noOrganization');

const resetForm = () => {
  form.name = '';
  form.email = '';
  form.password = '';
  form.role = assignableRoleOptions.value[0]?.value ?? 'agent';
  form.isActive = true;
};

const submitForm = async () => {
  successMessage.value = '';
  pageError.value = null;
  authStore.setError(null);

  if (!canSubmit.value) {
    pageError.value = t('team.messages.invalid');
    return;
  }

  try {
    const user = await authStore.createTeamMember({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
      isActive: form.isActive
    });
    successMessage.value = t('team.messages.added', {
      name: user.name,
      organization: currentOrganizationName.value
    });
    resetForm();
  } catch (unknownError) {
    pageError.value = toApiErrorMessage(unknownError);
  }
};

watch(
  assignableRoleOptions,
  (options) => {
    if (!options.some((option) => option.value === form.role)) {
      form.role = options[0]?.value ?? 'agent';
    }
  },
  { immediate: true }
);

onMounted(async () => {
  authStore.hydrateFromStorage();
  pageError.value = null;

  if (authStore.sessionToken) {
    await authStore.refreshCurrentUser({ silent: true }).catch(() => undefined);
  }

  if (authStore.canManageTeam) {
    await authStore.fetchUsers().catch((unknownError) => {
      pageError.value = toApiErrorMessage(unknownError);
    });
  }
});
</script>

<template>
  <section class="space-y-6">
    <AppPageHeader
      :eyebrow="t('team.header.kicker')"
      :title="t('team.header.title')"
      :description="t('team.header.description', { organization: currentOrganizationName })"
      :meta="t('team.header.meta')"
    >
      <template #actions>
        <button
          type="button"
          class="btn-secondary"
          :disabled="authStore.isLoadingUsers"
          @click="authStore.fetchUsers()"
        >
          {{ authStore.isLoadingUsers ? t('common.loading') : t('common.refresh') }}
        </button>
      </template>
    </AppPageHeader>

    <div v-if="pageError || authStore.error" class="alert-error">
      {{ pageError || authStore.error }}
    </div>
    <div
      v-if="successMessage"
      class="alert-success"
    >
      {{ successMessage }}
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section class="panel">
        <div class="panel-body">
          <AppSectionHeader
            :title="t('team.users.title')"
            :description="t('team.users.description', { count: teamMembers.length })"
          />

          <div
            v-if="!canCreateTeamMembers"
            class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {{ t('team.users.cannotManage') }}
          </div>

          <div v-else-if="authStore.isLoadingUsers && teamMembers.length === 0" class="space-y-3">
            <div class="skeleton h-16 w-full"></div>
            <div class="skeleton h-16 w-full"></div>
            <div class="skeleton h-16 w-full"></div>
          </div>

          <AppEmptyState
            v-else-if="teamMembers.length === 0"
            :title="t('team.users.emptyTitle')"
            :description="t('team.users.emptyDescription')"
          />

          <ul v-else class="record-list mt-5">
            <li v-for="user in teamMembers" :key="user.id" class="record-row px-1">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-semibold text-slate-950 dark:text-white">
                      {{ user.name }}
                    </p>
                    <span class="status-chip">{{ formatRoleLabel(user.role) }}</span>
                    <span
                      class="rounded-full border px-2.5 py-1 text-xs font-semibold"
                      :class="
                        user.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-100 text-slate-500'
                      "
                    >
                      {{ user.isActive ? t('userStatuses.active') : t('userStatuses.inactive') }}
                    </span>
                  </div>
                  <p class="mt-1 text-sm text-slate-500">{{ user.email }}</p>
                </div>
                <p class="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {{ organizationLabel(user) }}
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <aside class="panel xl:sticky xl:top-24 xl:self-start">
        <div class="panel-body">
          <AppSectionHeader
            :title="t('team.form.title')"
            :description="t('team.form.description', { organization: currentOrganizationName })"
          />

          <form class="mt-5 space-y-4" @submit.prevent="submitForm">
            <label class="block">
              <span class="field-label">{{ t('team.form.name') }}</span>
              <input
                v-model="form.name"
                class="input-base"
                type="text"
                :disabled="!canCreateTeamMembers || authStore.isCreatingUser"
              />
            </label>

            <label class="block">
              <span class="field-label">{{ t('team.form.email') }}</span>
              <input
                v-model="form.email"
                class="input-base"
                type="email"
                :disabled="!canCreateTeamMembers || authStore.isCreatingUser"
              />
            </label>

            <label class="block">
              <span class="field-label">{{ t('team.form.temporaryPassword') }}</span>
              <input
                v-model="form.password"
                class="input-base"
                type="password"
                autocomplete="new-password"
                :disabled="!canCreateTeamMembers || authStore.isCreatingUser"
              />
            </label>

            <label class="block">
              <span class="field-label">{{ t('team.form.role') }}</span>
              <select
                v-model="form.role"
                class="input-base"
                :disabled="!canCreateTeamMembers || authStore.isCreatingUser"
              >
                <option v-for="role in assignableRoleOptions" :key="role.value" :value="role.value">
                  {{ role.label }}
                </option>
              </select>
            </label>

            <label
              class="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <span>
                <span class="block text-sm font-medium text-slate-800 dark:text-slate-100">{{ t('team.form.active') }}</span>
                <span class="mt-1 block text-xs text-slate-500 dark:text-slate-400">{{ t('team.form.activeHint') }}</span>
              </span>
              <input
                v-model="form.isActive"
                class="mt-1 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-200"
                type="checkbox"
                :disabled="!canCreateTeamMembers || authStore.isCreatingUser"
              />
            </label>

            <div class="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
              <button type="submit" class="btn-primary" :disabled="!canSubmit">
                {{ authStore.isCreatingUser ? t('team.form.creating') : t('team.form.createUser') }}
              </button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  </section>
</template>
