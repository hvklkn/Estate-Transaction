<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import { toApiErrorMessage } from '~/services/api.errors';
import { useAuthStore } from '~/stores/auth';
import { useClientsStore } from '~/stores/clients';
import { usePropertiesStore } from '~/stores/properties';
import { PROPERTY_LISTING_TYPE_OPTIONS, PROPERTY_STATUS_OPTIONS, PROPERTY_TYPE_OPTIONS, type CreatePropertyPayload, type Property, type PropertyListingType, type PropertyStatus, type PropertyType } from '~/types/property';

const authStore = useAuthStore();
const clientsStore = useClientsStore();
const propertiesStore = usePropertiesStore();

useHead({ title: 'Properties' });

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
  currency: 'USD',
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
    return { error: 'Price must be a valid number.' };
  }

  if (numericValue < 0) {
    return { error: 'Price must be zero or greater.' };
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
const currentRoleLabel = computed(() => authStore.currentUser?.role ?? 'unknown');
const currentOrganizationIdLabel = computed(() => authStore.currentUser?.organizationId ?? 'none');
const currentOrganizationLabel = computed(() => authStore.currentOrganization?.name ?? authStore.currentUser?.organizationId ?? 'none');
const visibleError = computed(() => submitError.value || propertiesStore.error || clientsStore.error);
const priceValidationError = computed(() => normalizeOptionalNumber(form.price).error ?? '');
const submitBlockReason = computed(() => {
  if (!authStore.isAuthenticated || !authStore.currentUser) {
    return 'Session is not loaded. Please sign in again.';
  }

  if (!authStore.sessionToken) {
    return 'Session token is missing. Please sign in again.';
  }

  if (!canEditForm.value) {
    return isEditing.value
      ? 'You do not have permission to update properties.'
      : 'You do not have permission to create properties.';
  }

  const title = toTrimmedText(form.title);
  if (title.length === 0) {
    return 'Title is required.';
  }

  if (title.length < 2) {
    return 'Title must be at least 2 characters.';
  }

  if (priceValidationError.value) {
    return priceValidationError.value;
  }

  if (selectedOwnerClientMissing.value) {
    return "Owner client must be selected from this organization's active clients.";
  }

  return '';
});
const permissionNotice = computed(() => {
  if (canEditForm.value) {
    return '';
  }

  if (isEditing.value && canCreate.value) {
    return 'Your role can create and view properties, but cannot edit or archive them.';
  }

  return 'Your role can view properties, but cannot create, edit, or archive them.';
});

const formatMoney = (value: number | null, currency: string) =>
  value === null
    ? 'Price not set'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        maximumFractionDigits: 0
      }).format(value);

const resetForm = () => {
  selectedPropertyId.value = null;
  form.title = '';
  form.type = 'apartment';
  form.listingType = 'sale';
  form.address = '';
  form.city = '';
  form.district = '';
  form.price = '';
  form.currency = 'USD';
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
  form.currency = property.currency;
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
    currency: toTrimmedText(form.currency).toUpperCase() || 'USD',
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
      successMessage.value = 'Property updated.';
    } else {
      const payload = buildPayload();
      setSubmitStatus('Sending POST /properties...');
      const property = await propertiesStore.createProperty(payload);
      successMessage.value = `Property created: ${property.title}.`;
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

  const confirmed = window.confirm(`Archive ${property.title}? This keeps audit history.`);
  if (!confirmed) {
    return;
  }

  try {
    await propertiesStore.deleteProperty(property.id);
    successMessage.value = 'Property archived.';
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
  if (authStore.sessionToken) {
    await authStore.refreshCurrentUser({ silent: true }).catch(() => undefined);
  }
  await Promise.all([clientsStore.fetchClients({ force: true }), propertiesStore.fetchProperties({ force: true })]);
});
</script>

<template>
  <section class="space-y-6">
    <header class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Inventory</p>
          <h1 class="mt-2 text-3xl font-semibold sm:text-4xl">Properties</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Maintain sale and rental inventory, owner links, status, and pricing for transaction workflows.</p>
          <p class="mt-3 text-xs text-slate-500">
            Session role:
            <span class="font-semibold text-slate-700 dark:text-slate-200">{{ currentRoleLabel }}</span>
            · Organization:
            <span class="font-semibold text-slate-700 dark:text-slate-200">{{ currentOrganizationLabel }}</span>
          </p>
        </div>
        <button type="button" class="btn-secondary" :disabled="propertiesStore.isLoading" @click="propertiesStore.refreshProperties()">
          {{ propertiesStore.isLoading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </header>

    <div v-if="visibleError" class="alert-error">
      {{ visibleError }}
    </div>
    <div v-if="successMessage" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      {{ successMessage }}
    </div>
    <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <p>
          Role:
          <span class="font-semibold">{{ currentRoleLabel }}</span>
        </p>
        <p>
          Organization:
          <span class="font-semibold">{{ currentOrganizationLabel }}</span>
        </p>
        <p>
          Organization ID:
          <span class="font-semibold">{{ currentOrganizationIdLabel }}</span>
        </p>
        <p>
          canCreate/canManage:
          <span class="font-semibold">{{ canCreate }}/{{ canManage }}</span>
        </p>
        <p>
          isCreating:
          <span class="font-semibold">{{ propertiesStore.isCreating }}</span>
        </p>
        <p>
          Store error:
          <span class="font-semibold">{{ propertiesStore.error || 'none' }}</span>
        </p>
        <p>
          Submit:
          <span class="font-semibold">{{ submitStatus }}</span>
        </p>
        <p>
          Last refresh count:
          <span class="font-semibold">{{ propertiesStore.lastRefreshCount ?? 'not loaded' }}</span>
        </p>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section class="panel">
        <div class="panel-body">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold">Property Inventory</h2>
              <p class="text-sm text-slate-500">{{ propertiesStore.count }} active records</p>
            </div>
          </div>

          <div v-if="propertiesStore.isLoading && propertiesStore.items.length === 0" class="space-y-3">
            <div class="skeleton h-20 w-full"></div>
            <div class="skeleton h-20 w-full"></div>
            <div class="skeleton h-20 w-full"></div>
          </div>

          <div v-else-if="propertiesStore.items.length === 0" class="empty-state">
            <h3 class="text-lg font-semibold">No properties yet</h3>
            <p class="mt-2 text-sm text-slate-500">Create property inventory to connect listings to transactions.</p>
          </div>

          <ul v-else class="divide-y divide-slate-100 dark:divide-slate-800">
            <li v-for="property in propertiesStore.items" :key="property.id" class="py-4">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-semibold text-slate-900 dark:text-slate-100">
                      {{ property.title }}
                    </p>
                    <span class="status-chip capitalize">{{ property.status }}</span>
                    <span class="status-chip capitalize">{{ property.listingType }}</span>
                  </div>
                  <p class="mt-1 text-sm text-slate-500">
                    {{ property.city || 'City not set' }}<span v-if="property.district">, {{ property.district }}</span>
                    ·
                    {{ formatMoney(property.price, property.currency) }}
                  </p>
                  <p v-if="property.ownerClient" class="mt-1 text-xs text-slate-500">Owner: {{ property.ownerClient.fullName }}</p>
                  <p v-if="property.description" class="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                    {{ property.description }}
                  </p>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <button v-if="canManage" type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="editProperty(property)">Edit</button>
                  <button v-if="canManage" type="button" class="btn-secondary px-3 py-1.5 text-xs" :disabled="propertiesStore.deletePropertyId === property.id" @click="deleteProperty(property)">
                    {{ propertiesStore.deletePropertyId === property.id ? 'Archiving...' : 'Archive' }}
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <aside class="panel">
        <div class="panel-body">
          <h2 class="text-lg font-semibold">
            {{ isEditing ? 'Edit Property' : 'Create Property' }}
          </h2>
          <p v-if="permissionNotice" class="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {{ permissionNotice }}
          </p>
          <p v-if="submitBlockReason" class="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {{ submitBlockReason }}
          </p>
          <p v-if="selectedOwnerClientMissing" class="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Owner client is not in the active client list for this organization.</p>

          <form class="mt-5 space-y-4" @submit.prevent="submitForm">
            <label class="block">
              <span class="field-label">Title</span>
              <input v-model="form.title" class="input-base" type="text" :disabled="!canEditForm" />
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="field-label">Type</span>
                <select v-model="form.type" class="input-base" :disabled="!canEditForm">
                  <option v-for="option in PROPERTY_TYPE_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <label class="block">
                <span class="field-label">Listing</span>
                <select v-model="form.listingType" class="input-base" :disabled="!canEditForm">
                  <option v-for="option in PROPERTY_LISTING_TYPE_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>
            </div>

            <label class="block">
              <span class="field-label">Owner Client</span>
              <select v-model="form.ownerClientId" class="input-base" :disabled="!canEditForm || clientsStore.isLoading">
                <option value="">No owner linked</option>
                <option v-for="client in clientsStore.items" :key="client.id" :value="client.id">
                  {{ client.fullName }}
                </option>
              </select>
            </label>

            <label class="block">
              <span class="field-label">Address</span>
              <input v-model="form.address" class="input-base" type="text" :disabled="!canEditForm" />
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="field-label">City</span>
                <input v-model="form.city" class="input-base" type="text" :disabled="!canEditForm" />
              </label>
              <label class="block">
                <span class="field-label">District</span>
                <input v-model="form.district" class="input-base" type="text" :disabled="!canEditForm" />
              </label>
            </div>

            <div class="grid gap-4 sm:grid-cols-[1fr_110px]">
              <label class="block">
                <span class="field-label">Price</span>
                <input v-model="form.price" class="input-base" min="0" step="0.01" type="number" :disabled="!canEditForm" />
              </label>
              <label class="block">
                <span class="field-label">Currency</span>
                <input v-model="form.currency" class="input-base uppercase" maxlength="3" type="text" :disabled="!canEditForm" />
              </label>
            </div>

            <label class="block">
              <span class="field-label">Status</span>
              <select v-model="form.status" class="input-base" :disabled="!canEditForm">
                <option v-for="option in PROPERTY_STATUS_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="block">
              <span class="field-label">Description</span>
              <textarea v-model="form.description" class="input-base min-h-28" :disabled="!canEditForm"></textarea>
            </label>

            <div class="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button type="button" class="btn-secondary" :disabled="propertiesStore.isCreating || Boolean(propertiesStore.updatePropertyId)" @click="resetForm">Clear</button>
              <button type="submit" class="btn-primary" :disabled="!canSubmit">
                {{ propertiesStore.isCreating || propertiesStore.updatePropertyId ? 'Saving...' : isEditing ? 'Save Property' : 'Create Property' }}
              </button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  </section>
</template>
