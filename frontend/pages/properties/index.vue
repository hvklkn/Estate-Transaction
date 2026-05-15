<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import { useAppI18n } from '~/composables/useAppI18n';
import { useUserSettings } from '~/composables/useUserSettings';
import { toApiErrorMessage } from '~/services/api.errors';
import { useAuthStore } from '~/stores/auth';
import { useClientsStore } from '~/stores/clients';
import { usePropertiesStore } from '~/stores/properties';
import { PROPERTY_LISTING_TYPE_OPTIONS, PROPERTY_STATUS_OPTIONS, PROPERTY_TYPE_OPTIONS, type CreatePropertyPayload, type Property, type PropertyListingType, type PropertyStatus, type PropertyType } from '~/types/property';
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES, normalizeCurrency } from '~/utils/formatCurrency';

const authStore = useAuthStore();
const clientsStore = useClientsStore();
const propertiesStore = usePropertiesStore();
const { t, formatCurrency } = useAppI18n();
const { settings, hydrateFromStorage } = useUserSettings();

useHead(() => ({ title: t('propertiesPage.meta.title') }));

const selectedPropertyId = ref<string | null>(null);
const successMessage = ref('');
const submitError = ref<string | null>(null);
const submitStatus = ref('Waiting for submit.');
const submitAttemptCount = ref(0);
interface PropertyFormState {
  title: string | null;
  type: PropertyType;
  listingType: PropertyListingType;
  address: string | null;
  city: string | null;
  district: string | null;
  price: string | number | null;
  currency: string | null;
  status: PropertyStatus;
  description: string | null;
  ownerClientId: string | null;
}

const form = reactive<PropertyFormState>({
  title: '',
  type: 'apartment' as PropertyType,
  listingType: 'sale' as PropertyListingType,
  address: '',
  city: '',
  district: '',
  price: '',
  currency: DEFAULT_CURRENCY,
  status: 'draft' as PropertyStatus,
  description: '',
  ownerClientId: ''
});

const toTrimmedText = (value: unknown) => String(value ?? '').trim();
const toOptionalText = (value: unknown) => toTrimmedText(value) || undefined;
const normalizeOptionalNumber = (value: unknown): { value?: number; error?: string } => {
  if (value === null || value === undefined) {
    return {};
  }

  const rawValue = typeof value === 'string' ? value.trim() : value;
  if (rawValue === '') {
    return {};
  }

  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) {
    return { error: t('propertiesPage.messages.priceInvalid') };
  }

  if (numericValue < 0) {
    return { error: t('propertiesPage.messages.priceMin') };
  }

  return { value: numericValue };
};

const selectedProperty = computed(() => propertiesStore.items.find((property) => property.id === selectedPropertyId.value) ?? null);
const isEditing = computed(() => Boolean(selectedProperty.value));
const canCreate = computed(() => authStore.canCreateTenantResources);
const canManage = computed(() => authStore.canManageTenantResources);
const canEditForm = computed(() => (isEditing.value ? canManage.value : canCreate.value));
const normalizedOwnerClientId = computed(() => toTrimmedText(form.ownerClientId));
const selectedOwnerClient = computed(() => (normalizedOwnerClientId.value ? (clientsStore.items.find((client) => client.id === normalizedOwnerClientId.value) ?? null) : null));
const selectedOwnerClientMissing = computed(() => Boolean(normalizedOwnerClientId.value) && !clientsStore.isLoading && !selectedOwnerClient.value);
const isSaving = computed(() => propertiesStore.isCreating || Boolean(propertiesStore.updatePropertyId));
const canSubmit = computed(() => !isSaving.value);
const currentRoleLabel = computed(() =>
  authStore.currentUser?.role ? t(`roles.${authStore.currentUser.role}`) : t('layout.noRole')
);
const currentOrganizationIdLabel = computed(() => authStore.currentUser?.organizationId ?? 'none');
const currentOrganizationLabel = computed(() => authStore.currentOrganization?.name ?? authStore.currentUser?.organizationId ?? t('layout.noOrganization'));
const visibleError = computed(() => submitError.value || propertiesStore.error || clientsStore.error);
const priceValidationError = computed(() => normalizeOptionalNumber(form.price).error ?? '');
const isDebugVisible = import.meta.dev;
const submitBlockReason = computed(() => {
  if (!authStore.isAuthenticated || !authStore.currentUser) {
    return t('propertiesPage.messages.noSession');
  }

  if (!authStore.sessionToken) {
    return t('propertiesPage.messages.missingToken');
  }

  if (!canEditForm.value) {
    return isEditing.value
      ? t('propertiesPage.messages.noUpdatePermission')
      : t('propertiesPage.messages.noCreatePermission');
  }

  const title = toTrimmedText(form.title);
  if (title.length === 0) {
    return t('propertiesPage.messages.titleRequired');
  }

  if (title.length < 2) {
    return t('propertiesPage.messages.titleMin');
  }

  if (priceValidationError.value) {
    return priceValidationError.value;
  }

  if (selectedOwnerClientMissing.value) {
    return t('propertiesPage.messages.ownerRequired');
  }

  return '';
});
const permissionNotice = computed(() => {
  if (canEditForm.value) {
    return '';
  }

  if (isEditing.value && canCreate.value) {
    return t('propertiesPage.messages.createOnlyPermission');
  }

  return t('propertiesPage.messages.viewOnlyPermission');
});

const formatMoney = (value: number | null, currency: string) =>
  value === null
    ? t('propertiesPage.messages.priceNotSet')
    : formatCurrency(value, {
        currency,
        maximumFractionDigits: 0
      });

const resetForm = () => {
  selectedPropertyId.value = null;
  form.title = '';
  form.type = 'apartment';
  form.listingType = 'sale';
  form.address = '';
  form.city = '';
  form.district = '';
  form.price = '';
  form.currency = settings.value.currency;
  form.status = 'draft';
  form.description = '';
  form.ownerClientId = '';
};

const editProperty = (property: Property) => {
  selectedPropertyId.value = property.id;
  form.title = property.title;
  form.type = property.type;
  form.listingType = property.listingType;
  form.address = property.address;
  form.city = property.city;
  form.district = property.district;
  form.price = property.price === null ? '' : String(property.price);
  form.currency = normalizeCurrency(property.currency);
  form.status = property.status;
  form.description = property.description;
  form.ownerClientId = property.ownerClientId ?? '';
};

const buildPayload = (): CreatePropertyPayload => {
  const price = normalizeOptionalNumber(form.price);
  if (price.error) {
    throw new Error(price.error);
  }

  const ownerClientId = normalizedOwnerClientId.value;

  return {
    title: toTrimmedText(form.title),
    type: form.type,
    listingType: form.listingType,
    address: toOptionalText(form.address),
    city: toOptionalText(form.city),
    district: toOptionalText(form.district),
    ...(price.value === undefined ? {} : { price: price.value }),
    currency: normalizeCurrency(toTrimmedText(form.currency)),
    status: form.status,
    description: toOptionalText(form.description),
    ...(ownerClientId ? { ownerClientId } : {})
  };
};

const setSubmitStatus = (message: string) => {
  submitStatus.value = message;
  if (import.meta.dev) {
    console.debug('[properties-page]', message);
  }
};

const submitForm = async () => {
  submitAttemptCount.value += 1;
  successMessage.value = '';
  submitError.value = null;
  propertiesStore.setError(null);
  setSubmitStatus(`Submit reached (${submitAttemptCount.value}).`);

  const blockedReason = submitBlockReason.value;
  if (blockedReason) {
    submitError.value = blockedReason;
    propertiesStore.setError(blockedReason);
    setSubmitStatus(`Submit blocked: ${blockedReason}`);
    return;
  }

  try {
    if (selectedProperty.value) {
      setSubmitStatus(`Sending update for property ${selectedProperty.value.id}...`);
      await propertiesStore.updateProperty(selectedProperty.value.id, buildPayload());
      successMessage.value = t('propertiesPage.messages.updated');
    } else {
      const payload = buildPayload();
      setSubmitStatus('Sending POST /properties...');
      const property = await propertiesStore.createProperty(payload);
      successMessage.value = t('propertiesPage.messages.created', { title: property.title });
    }
    setSubmitStatus(`Submit succeeded. Inventory now has ${propertiesStore.count} records.`);
    resetForm();
  } catch (unknownError) {
    const message = propertiesStore.error || toApiErrorMessage(unknownError);
    submitError.value = message;
    propertiesStore.setError(message);
    setSubmitStatus(`Submit failed: ${message}`);
  }
};

const deleteProperty = async (property: Property) => {
  if (!canManage.value || !import.meta.client) {
    return;
  }

  const confirmed = window.confirm(t('propertiesPage.messages.archiveConfirm', { title: property.title }));
  if (!confirmed) {
    return;
  }

  try {
    await propertiesStore.deleteProperty(property.id);
    successMessage.value = t('propertiesPage.messages.archived');
    if (selectedPropertyId.value === property.id) {
      resetForm();
    }
  } catch (unknownError) {
    const message = propertiesStore.error || toApiErrorMessage(unknownError);
    submitError.value = message;
    propertiesStore.setError(message);
    setSubmitStatus(`Archive failed: ${message}`);
  }
};

onMounted(async () => {
  authStore.hydrateFromStorage();
  hydrateFromStorage();
  if (!form.currency) {
    form.currency = settings.value.currency;
  }
  if (authStore.sessionToken) {
    await authStore.refreshCurrentUser({ silent: true }).catch(() => undefined);
  }
  await Promise.all([clientsStore.fetchClients({ force: true }), propertiesStore.fetchProperties({ force: true })]);
});

const propertyTypeOptions = computed(() =>
  PROPERTY_TYPE_OPTIONS.map((option) => ({
    value: option.value,
    label: t(`property.types.${option.value}`)
  }))
);
const propertyListingTypeOptions = computed(() =>
  PROPERTY_LISTING_TYPE_OPTIONS.map((option) => ({
    value: option.value,
    label: t(`property.listingTypes.${option.value}`)
  }))
);
const propertyStatusOptions = computed(() =>
  PROPERTY_STATUS_OPTIONS.map((option) => ({
    value: option.value,
    label: t(`property.statuses.${option.value}`)
  }))
);
</script>

<template>
  <section class="space-y-6">
    <AppPageHeader
      :eyebrow="t('propertiesPage.header.kicker')"
      :title="t('propertiesPage.header.title')"
      :description="t('propertiesPage.header.description')"
    >
      <template #meta>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          {{ t('propertiesPage.header.sessionRole') }}:
          <span class="font-semibold text-slate-700 dark:text-slate-200">{{ currentRoleLabel }}</span>
          · {{ t('propertiesPage.header.organization') }}:
          <span class="font-semibold text-slate-700 dark:text-slate-200">{{ currentOrganizationLabel }}</span>
        </p>
      </template>
      <template #actions>
        <button type="button" class="btn-secondary" :disabled="propertiesStore.isLoading" @click="propertiesStore.refreshProperties()">
          {{ propertiesStore.isLoading ? t('common.loading') : t('common.refresh') }}
        </button>
      </template>
    </AppPageHeader>

    <div v-if="visibleError" class="alert-error">
      {{ visibleError }}
    </div>
    <div v-if="successMessage" class="alert-success">
      {{ successMessage }}
    </div>
    <div v-if="isDebugVisible" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <p>
          {{ t('propertiesPage.debug.role') }}:
          <span class="font-semibold">{{ currentRoleLabel }}</span>
        </p>
        <p>
          {{ t('propertiesPage.debug.organization') }}:
          <span class="font-semibold">{{ currentOrganizationLabel }}</span>
        </p>
        <p>
          {{ t('propertiesPage.debug.organizationId') }}:
          <span class="font-semibold">{{ currentOrganizationIdLabel }}</span>
        </p>
        <p>
          {{ t('propertiesPage.debug.permissions') }}:
          <span class="font-semibold">{{ canCreate }}/{{ canManage }}</span>
        </p>
        <p>
          {{ t('propertiesPage.debug.isCreating') }}:
          <span class="font-semibold">{{ propertiesStore.isCreating }}</span>
        </p>
        <p>
          {{ t('propertiesPage.debug.storeError') }}:
          <span class="font-semibold">{{ propertiesStore.error || t('propertiesPage.debug.none') }}</span>
        </p>
        <p>
          {{ t('propertiesPage.debug.submit') }}:
          <span class="font-semibold">{{ submitStatus }}</span>
        </p>
        <p>
          {{ t('propertiesPage.debug.lastRefreshCount') }}:
          <span class="font-semibold">{{ propertiesStore.lastRefreshCount ?? t('propertiesPage.debug.notLoaded') }}</span>
        </p>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section class="panel">
        <div class="panel-body">
          <AppSectionHeader
            :title="t('propertiesPage.inventory.title')"
            :description="t('propertiesPage.inventory.description', { count: propertiesStore.count })"
          />

          <div v-if="propertiesStore.isLoading && propertiesStore.items.length === 0" class="space-y-3">
            <div class="skeleton h-20 w-full"></div>
            <div class="skeleton h-20 w-full"></div>
            <div class="skeleton h-20 w-full"></div>
          </div>

          <AppEmptyState
            v-else-if="propertiesStore.items.length === 0"
            :title="t('propertiesPage.inventory.emptyTitle')"
            :description="t('propertiesPage.inventory.emptyDescription')"
          >
            <template #actions>
              <button type="button" class="btn-primary" :disabled="!canCreate" @click="resetForm">{{ t('propertiesPage.form.createProperty') }}</button>
            </template>
          </AppEmptyState>

          <ul v-else class="record-list mt-5">
            <li v-for="property in propertiesStore.items" :key="property.id" class="record-row px-1">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-semibold text-slate-950 dark:text-white">
                      {{ property.title }}
                    </p>
                    <span class="status-chip">{{ t(`property.statuses.${property.status}`) }}</span>
                    <span class="status-chip">{{ t(`property.listingTypes.${property.listingType}`) }}</span>
                  </div>
                  <div class="mt-2 flex flex-wrap gap-2 text-sm">
                    <span class="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {{ property.city || t('propertiesPage.inventory.cityNotSet') }}<span v-if="property.district">, {{ property.district }}</span>
                    </span>
                    <span class="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      {{ formatMoney(property.price, property.currency) }}
                    </span>
                  </div>
                  <p v-if="property.ownerClient" class="mt-1 text-xs text-slate-500">{{ t('propertiesPage.inventory.owner') }}: {{ property.ownerClient.fullName }}</p>
                  <p v-if="property.description" class="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                    {{ property.description }}
                  </p>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <button v-if="canManage" type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="editProperty(property)">{{ t('common.edit') }}</button>
                  <button v-if="canManage" type="button" class="btn-secondary px-3 py-1.5 text-xs" :disabled="propertiesStore.deletePropertyId === property.id" @click="deleteProperty(property)">
                    {{ propertiesStore.deletePropertyId === property.id ? t('common.archiving') : t('common.archive') }}
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
            :title="isEditing ? t('propertiesPage.form.editTitle') : t('propertiesPage.form.createTitle')"
            :description="t('propertiesPage.form.description')"
          />
          <p v-if="permissionNotice" class="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {{ permissionNotice }}
          </p>
          <p v-if="submitBlockReason" class="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {{ submitBlockReason }}
          </p>
          <p v-if="selectedOwnerClientMissing" class="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{{ t('propertiesPage.form.ownerMissing') }}</p>

          <form class="mt-5 space-y-4" @submit.prevent="submitForm">
            <label class="block">
              <span class="field-label">{{ t('propertiesPage.form.title') }}</span>
              <input v-model="form.title" class="input-base" type="text" :disabled="!canEditForm" />
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="field-label">{{ t('propertiesPage.form.type') }}</span>
                <select v-model="form.type" class="input-base" :disabled="!canEditForm">
                  <option v-for="option in propertyTypeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <label class="block">
                <span class="field-label">{{ t('propertiesPage.form.listingType') }}</span>
                <select v-model="form.listingType" class="input-base" :disabled="!canEditForm">
                  <option v-for="option in propertyListingTypeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>
            </div>

            <label class="block">
              <span class="field-label">{{ t('propertiesPage.form.ownerClient') }}</span>
              <select v-model="form.ownerClientId" class="input-base" :disabled="!canEditForm || clientsStore.isLoading">
                <option value="">{{ t('propertiesPage.form.noOwnerLinked') }}</option>
                <option v-for="client in clientsStore.items" :key="client.id" :value="client.id">
                  {{ client.fullName }}
                </option>
              </select>
            </label>

            <label class="block">
              <span class="field-label">{{ t('propertiesPage.form.address') }}</span>
              <input v-model="form.address" class="input-base" type="text" :disabled="!canEditForm" />
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="field-label">{{ t('propertiesPage.form.city') }}</span>
                <input v-model="form.city" class="input-base" type="text" :disabled="!canEditForm" />
              </label>
              <label class="block">
                <span class="field-label">{{ t('propertiesPage.form.district') }}</span>
                <input v-model="form.district" class="input-base" type="text" :disabled="!canEditForm" />
              </label>
            </div>

            <div class="grid gap-4 sm:grid-cols-[1fr_110px]">
              <label class="block">
                <span class="field-label">{{ t('propertiesPage.form.price') }}</span>
                <input v-model="form.price" class="input-base" min="0" step="0.01" type="number" :disabled="!canEditForm" />
              </label>
              <label class="block">
                <span class="field-label">{{ t('propertiesPage.form.currency') }}</span>
                <select v-model="form.currency" class="input-base uppercase" :disabled="!canEditForm">
                  <option v-for="option in SUPPORTED_CURRENCIES" :key="option.code" :value="option.code">
                    {{ option.code }}
                  </option>
                </select>
              </label>
            </div>

            <label class="block">
              <span class="field-label">{{ t('propertiesPage.form.status') }}</span>
              <select v-model="form.status" class="input-base" :disabled="!canEditForm">
                <option v-for="option in propertyStatusOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="block">
              <span class="field-label">{{ t('propertiesPage.form.descriptionLabel') }}</span>
              <textarea v-model="form.description" class="input-base min-h-28" :disabled="!canEditForm"></textarea>
            </label>

            <div class="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button type="button" class="btn-secondary" :disabled="propertiesStore.isCreating || Boolean(propertiesStore.updatePropertyId)" @click="resetForm">{{ t('common.clear') }}</button>
              <button type="submit" class="btn-primary" :disabled="!canSubmit">
                {{ propertiesStore.isCreating || propertiesStore.updatePropertyId ? t('common.saving') : isEditing ? t('propertiesPage.form.saveProperty') : t('propertiesPage.form.createProperty') }}
              </button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  </section>
</template>
