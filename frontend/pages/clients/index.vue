<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import { useAppI18n } from '~/composables/useAppI18n';
import { useAuthStore } from '~/stores/auth';
import { useClientsStore } from '~/stores/clients';
import { CLIENT_TYPE_OPTIONS, type Client, type ClientType, type CreateClientPayload } from '~/types/client';

const authStore = useAuthStore();
const clientsStore = useClientsStore();
const { t } = useAppI18n();

useHead(() => ({ title: t('clients.meta.title') }));

const selectedClientId = ref<string | null>(null);
const successMessage = ref('');
const form = reactive({
  fullName: '',
  phone: '',
  email: '',
  type: 'buyer' as ClientType,
  notes: ''
});

const selectedClient = computed(
  () => clientsStore.items.find((client) => client.id === selectedClientId.value) ?? null
);
const isEditing = computed(() => Boolean(selectedClient.value));
const canCreate = computed(() => authStore.canCreateTenantResources);
const canManage = computed(() => authStore.canManageTenantResources);
const canSubmit = computed(
  () =>
    canCreate.value &&
    form.fullName.trim().length >= 2 &&
    !clientsStore.isCreating &&
    !clientsStore.updateClientId
);

const resetForm = () => {
  selectedClientId.value = null;
  form.fullName = '';
  form.phone = '';
  form.email = '';
  form.type = 'buyer';
  form.notes = '';
};

const editClient = (client: Client) => {
  selectedClientId.value = client.id;
  form.fullName = client.fullName;
  form.phone = client.phone;
  form.email = client.email;
  form.type = client.type;
  form.notes = client.notes;
};

const buildPayload = (): CreateClientPayload => ({
  fullName: form.fullName.trim(),
  phone: form.phone.trim() || undefined,
  email: form.email.trim() || undefined,
  type: form.type,
  notes: form.notes.trim() || undefined
});

const submitForm = async () => {
  if (!canSubmit.value) {
    return;
  }

  try {
    if (selectedClient.value) {
      await clientsStore.updateClient(selectedClient.value.id, buildPayload());
      successMessage.value = t('clients.messages.updated');
    } else {
      await clientsStore.createClient(buildPayload());
      successMessage.value = t('clients.messages.created');
    }
    resetForm();
  } catch {
    // Store error is rendered below.
  }
};

const deleteClient = async (client: Client) => {
  if (!canManage.value || !import.meta.client) {
    return;
  }

  const confirmed = window.confirm(t('clients.messages.archiveConfirm', { name: client.fullName }));
  if (!confirmed) {
    return;
  }

  try {
    await clientsStore.deleteClient(client.id);
    successMessage.value = t('clients.messages.archived');
    if (selectedClientId.value === client.id) {
      resetForm();
    }
  } catch {
    // Store error is rendered below.
  }
};

onMounted(async () => {
  authStore.hydrateFromStorage();
  await clientsStore.fetchClients({ force: true });
});

const clientTypeOptions = computed(() =>
  CLIENT_TYPE_OPTIONS.map((option) => ({
    value: option.value,
    label: t(`clients.types.${option.value}`)
  }))
);
</script>

<template>
  <section class="space-y-6">
    <AppPageHeader
      :eyebrow="t('clients.header.kicker')"
      :title="t('clients.header.title')"
      :description="t('clients.header.description')"
      :meta="t('clients.header.meta', { count: clientsStore.count })"
    >
      <template #actions>
        <button type="button" class="btn-secondary" :disabled="clientsStore.isLoading" @click="clientsStore.refreshClients()">
          {{ clientsStore.isLoading ? t('common.loading') : t('common.refresh') }}
        </button>
      </template>
    </AppPageHeader>

    <div v-if="clientsStore.error" class="alert-error">{{ clientsStore.error }}</div>
    <div v-if="successMessage" class="alert-success">
      {{ successMessage }}
    </div>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section class="panel">
        <div class="panel-body">
          <AppSectionHeader
            :title="t('clients.directory.title')"
            :description="t('clients.directory.description', { count: clientsStore.count })"
          />

          <div v-if="clientsStore.isLoading && clientsStore.items.length === 0" class="space-y-3">
            <div class="skeleton h-16 w-full"></div>
            <div class="skeleton h-16 w-full"></div>
            <div class="skeleton h-16 w-full"></div>
          </div>

          <AppEmptyState
            v-else-if="clientsStore.items.length === 0"
            :title="t('clients.directory.emptyTitle')"
            :description="t('clients.directory.emptyDescription')"
          >
            <template #actions>
              <button type="button" class="btn-primary" :disabled="!canCreate" @click="resetForm">{{ t('clients.form.createClient') }}</button>
            </template>
          </AppEmptyState>

          <ul v-else class="record-list mt-5">
            <li v-for="client in clientsStore.items" :key="client.id" class="record-row px-1">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-semibold text-slate-950 dark:text-white">{{ client.fullName }}</p>
                    <span class="status-chip">{{ t(`clients.types.${client.type}`) }}</span>
                  </div>
                  <p class="mt-1 text-sm text-slate-500">
                    {{ client.email || t('clients.messages.noEmail') }}<span v-if="client.phone"> · {{ client.phone }}</span>
                  </p>
                  <p v-if="client.notes" class="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{{ client.notes }}</p>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <button v-if="canManage" type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="editClient(client)">
                    {{ t('common.edit') }}
                  </button>
                  <button
                    v-if="canManage"
                    type="button"
                    class="btn-secondary px-3 py-1.5 text-xs"
                    :disabled="clientsStore.deleteClientId === client.id"
                    @click="deleteClient(client)"
                  >
                    {{ clientsStore.deleteClientId === client.id ? t('common.archiving') : t('common.archive') }}
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <aside class="panel xl:sticky xl:top-24 xl:self-start">
        <div class="panel-body">
          <AppSectionHeader
            :title="isEditing ? t('clients.form.editTitle') : t('clients.form.createTitle')"
            :description="t('clients.form.description')"
          />
          <p v-if="!canCreate" class="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {{ t('clients.form.cannotCreate') }}
          </p>

          <form class="mt-5 space-y-4" @submit.prevent="submitForm">
            <label class="block">
              <span class="field-label">{{ t('clients.form.fullName') }}</span>
              <input v-model="form.fullName" class="input-base" type="text" :disabled="!canCreate" />
            </label>

            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <label class="block">
                <span class="field-label">{{ t('clients.form.phone') }}</span>
                <input v-model="form.phone" class="input-base" type="tel" :disabled="!canCreate" />
              </label>
              <label class="block">
                <span class="field-label">{{ t('clients.form.email') }}</span>
                <input v-model="form.email" class="input-base" type="email" :disabled="!canCreate" />
              </label>
            </div>

            <label class="block">
              <span class="field-label">{{ t('clients.form.type') }}</span>
              <select v-model="form.type" class="input-base" :disabled="!canCreate">
                <option v-for="option in clientTypeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="block">
              <span class="field-label">{{ t('clients.form.notes') }}</span>
              <textarea v-model="form.notes" class="input-base min-h-28" :disabled="!canCreate"></textarea>
            </label>

            <div class="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button type="button" class="btn-secondary" :disabled="clientsStore.isCreating || Boolean(clientsStore.updateClientId)" @click="resetForm">
                {{ t('common.clear') }}
              </button>
              <button type="submit" class="btn-primary" :disabled="!canSubmit">
                {{ clientsStore.isCreating || clientsStore.updateClientId ? t('common.saving') : isEditing ? t('clients.form.saveClient') : t('clients.form.createClient') }}
              </button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  </section>
</template>
