<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import { useAuthStore } from '~/stores/auth';
import { useClientsStore } from '~/stores/clients';
import { usePropertiesStore } from '~/stores/properties';
import {
  PROPERTY_LISTING_TYPE_OPTIONS,
  PROPERTY_STATUS_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  type CreatePropertyPayload,
  type Property,
  type PropertyListingType,
  type PropertyStatus,
  type PropertyType
} from '~/types/property';

const authStore = useAuthStore();
const clientsStore = useClientsStore();
const propertiesStore = usePropertiesStore();

useHead({ title: 'Properties' });

const selectedPropertyId = ref<string | null>(null);
const successMessage = ref('');
const form = reactive({
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

const selectedProperty = computed(
  () => propertiesStore.items.find((property) => property.id === selectedPropertyId.value) ?? null
);
const isEditing = computed(() => Boolean(selectedProperty.value));
const canCreate = computed(() => authStore.canCreateTenantResources);
const canManage = computed(() => authStore.canManageTenantResources);
const canSubmit = computed(
  () =>
    canCreate.value &&
    form.title.trim().length >= 2 &&
    !propertiesStore.isCreating &&
    !propertiesStore.updatePropertyId
);

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
  const price = Number(form.price);

  return {
    title: form.title.trim(),
    type: form.type,
    listingType: form.listingType,
    address: form.address.trim() || undefined,
    city: form.city.trim() || undefined,
    district: form.district.trim() || undefined,
    price: form.price.trim() && Number.isFinite(price) ? price : undefined,
    currency: form.currency.trim().toUpperCase() || 'USD',
    status: form.status,
    description: form.description.trim() || undefined,
    ownerClientId: form.ownerClientId || undefined
  };
};

const submitForm = async () => {
  if (!canSubmit.value) {
    return;
  }

  try {
    if (selectedProperty.value) {
      await propertiesStore.updateProperty(selectedProperty.value.id, buildPayload());
      successMessage.value = 'Property updated.';
    } else {
      await propertiesStore.createProperty(buildPayload());
      successMessage.value = 'Property created.';
    }
    resetForm();
  } catch {
    // Store error is rendered below.
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
  } catch {
    // Store error is rendered below.
  }
};

onMounted(async () => {
  authStore.hydrateFromStorage();
  await Promise.all([
    clientsStore.fetchClients({ force: true }),
    propertiesStore.fetchProperties({ force: true })
  ]);
});
</script>

<template>
  <section class="space-y-6">
    <header class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Inventory</p>
          <h1 class="mt-2 text-3xl font-semibold sm:text-4xl">Properties</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Maintain sale and rental inventory, owner links, status, and pricing for transaction workflows.
          </p>
        </div>
        <button type="button" class="btn-secondary" :disabled="propertiesStore.isLoading" @click="propertiesStore.refreshProperties()">
          {{ propertiesStore.isLoading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </header>

    <div v-if="propertiesStore.error || clientsStore.error" class="alert-error">
      {{ propertiesStore.error || clientsStore.error }}
    </div>
    <div v-if="successMessage" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      {{ successMessage }}
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
                    <p class="font-semibold text-slate-900 dark:text-slate-100">{{ property.title }}</p>
                    <span class="status-chip capitalize">{{ property.status }}</span>
                    <span class="status-chip capitalize">{{ property.listingType }}</span>
                  </div>
                  <p class="mt-1 text-sm text-slate-500">
                    {{ property.city || 'City not set' }}<span v-if="property.district">, {{ property.district }}</span> ·
                    {{ formatMoney(property.price, property.currency) }}
                  </p>
                  <p v-if="property.ownerClient" class="mt-1 text-xs text-slate-500">
                    Owner: {{ property.ownerClient.fullName }}
                  </p>
                  <p v-if="property.description" class="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                    {{ property.description }}
                  </p>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <button v-if="canManage" type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="editProperty(property)">
                    Edit
                  </button>
                  <button
                    v-if="canManage"
                    type="button"
                    class="btn-secondary px-3 py-1.5 text-xs"
                    :disabled="propertiesStore.deletePropertyId === property.id"
                    @click="deleteProperty(property)"
                  >
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
          <h2 class="text-lg font-semibold">{{ isEditing ? 'Edit Property' : 'Create Property' }}</h2>
          <p v-if="!canCreate" class="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Your role can view properties, but cannot create or edit them.
          </p>

          <form class="mt-5 space-y-4" @submit.prevent="submitForm">
            <label class="block">
              <span class="field-label">Title</span>
              <input v-model="form.title" class="input-base" type="text" :disabled="!canCreate" />
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="field-label">Type</span>
                <select v-model="form.type" class="input-base" :disabled="!canCreate">
                  <option v-for="option in PROPERTY_TYPE_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <label class="block">
                <span class="field-label">Listing</span>
                <select v-model="form.listingType" class="input-base" :disabled="!canCreate">
                  <option v-for="option in PROPERTY_LISTING_TYPE_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>
            </div>

            <label class="block">
              <span class="field-label">Owner Client</span>
              <select v-model="form.ownerClientId" class="input-base" :disabled="!canCreate || clientsStore.isLoading">
                <option value="">No owner linked</option>
                <option v-for="client in clientsStore.items" :key="client.id" :value="client.id">
                  {{ client.fullName }}
                </option>
              </select>
            </label>

            <label class="block">
              <span class="field-label">Address</span>
              <input v-model="form.address" class="input-base" type="text" :disabled="!canCreate" />
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="field-label">City</span>
                <input v-model="form.city" class="input-base" type="text" :disabled="!canCreate" />
              </label>
              <label class="block">
                <span class="field-label">District</span>
                <input v-model="form.district" class="input-base" type="text" :disabled="!canCreate" />
              </label>
            </div>

            <div class="grid gap-4 sm:grid-cols-[1fr_110px]">
              <label class="block">
                <span class="field-label">Price</span>
                <input v-model="form.price" class="input-base" min="0" step="0.01" type="number" :disabled="!canCreate" />
              </label>
              <label class="block">
                <span class="field-label">Currency</span>
                <input v-model="form.currency" class="input-base uppercase" maxlength="3" type="text" :disabled="!canCreate" />
              </label>
            </div>

            <label class="block">
              <span class="field-label">Status</span>
              <select v-model="form.status" class="input-base" :disabled="!canCreate">
                <option v-for="option in PROPERTY_STATUS_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="block">
              <span class="field-label">Description</span>
              <textarea v-model="form.description" class="input-base min-h-28" :disabled="!canCreate"></textarea>
            </label>

            <div class="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button type="button" class="btn-secondary" :disabled="propertiesStore.isCreating || Boolean(propertiesStore.updatePropertyId)" @click="resetForm">
                Clear
              </button>
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
