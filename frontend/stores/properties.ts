import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { toApiErrorMessage } from '~/services/api.errors';
import { usePropertiesApi } from '~/services/properties.api';
import type { CreatePropertyPayload, Property, UpdatePropertyPayload } from '~/types/property';

export const usePropertiesStore = defineStore('properties', () => {
  const api = usePropertiesApi();

  const items = ref<Property[]>([]);
  const isLoading = ref(false);
  const isCreating = ref(false);
  const updatePropertyId = ref<string | null>(null);
  const deletePropertyId = ref<string | null>(null);
  const error = ref<string | null>(null);
  const hasLoaded = ref(false);
  const lastAction = ref('Idle.');
  const lastCreatedPropertyId = ref<string | null>(null);
  const lastRefreshCount = ref<number | null>(null);

  const count = computed(() => items.value.length);

  const setError = (message: string | null) => {
    error.value = message;
  };

  const setLastAction = (message: string) => {
    lastAction.value = message;
    if (import.meta.dev) {
      console.debug('[properties-store]', message);
    }
  };

  const fetchProperties = async (options: { force?: boolean; throwOnError?: boolean } = {}) => {
    if (isLoading.value || (hasLoaded.value && !options.force)) {
      return items.value;
    }

    isLoading.value = true;
    setError(null);
    setLastAction('Loading properties list...');

    try {
      items.value = await api.listProperties();
      hasLoaded.value = true;
      lastRefreshCount.value = items.value.length;
      setLastAction(`Loaded ${items.value.length} properties.`);
      return items.value;
    } catch (unknownError) {
      const message = toApiErrorMessage(unknownError);
      setError(message);
      setLastAction(`Property list failed: ${message}`);
      if (options.throwOnError) {
        throw new Error(message);
      }

      return undefined;
    } finally {
      isLoading.value = false;
    }
  };

  const refreshProperties = async (options: { throwOnError?: boolean } = {}) => {
    return fetchProperties({ force: true, throwOnError: options.throwOnError });
  };

  const createProperty = async (payload: CreatePropertyPayload) => {
    isCreating.value = true;
    setError(null);
    lastCreatedPropertyId.value = null;
    setLastAction('Sending create property request...');

    try {
      const property = await api.createProperty(payload);
      lastCreatedPropertyId.value = property.id;
      setLastAction(`Create request succeeded for "${property.title}". Refreshing list...`);

      await refreshProperties({ throwOnError: true });
      const createdPropertyIsVisible = items.value.some((item) => item.id === property.id);
      if (!createdPropertyIsVisible) {
        throw new Error(
          `Property was created but did not appear in the refreshed list. Created property id: ${property.id}.`
        );
      }

      setLastAction(`Created "${property.title}" and refreshed ${items.value.length} properties.`);
      return property;
    } catch (unknownError) {
      const message = toApiErrorMessage(unknownError);
      setError(message);
      setLastAction(`Create property failed: ${message}`);
      throw unknownError;
    } finally {
      isCreating.value = false;
    }
  };

  const updateProperty = async (id: string, payload: UpdatePropertyPayload) => {
    updatePropertyId.value = id;
    setError(null);
    setLastAction(`Sending update property request for ${id}...`);

    try {
      const property = await api.updateProperty(id, payload);
      setLastAction(`Update request succeeded for "${property.title}". Refreshing list...`);
      await refreshProperties({ throwOnError: true });
      setLastAction(`Updated "${property.title}" and refreshed ${items.value.length} properties.`);
      return property;
    } catch (unknownError) {
      const message = toApiErrorMessage(unknownError);
      setError(message);
      setLastAction(`Update property failed: ${message}`);
      throw unknownError;
    } finally {
      updatePropertyId.value = null;
    }
  };

  const deleteProperty = async (id: string) => {
    deletePropertyId.value = id;
    setError(null);
    setLastAction(`Sending archive property request for ${id}...`);

    try {
      const result = await api.deleteProperty(id);
      setLastAction(`Archive request succeeded for ${id}. Refreshing list...`);
      await refreshProperties({ throwOnError: true });
      setLastAction(`Archived property and refreshed ${items.value.length} properties.`);
      return result;
    } catch (unknownError) {
      const message = toApiErrorMessage(unknownError);
      setError(message);
      setLastAction(`Archive property failed: ${message}`);
      throw unknownError;
    } finally {
      deletePropertyId.value = null;
    }
  };

  return {
    items,
    isLoading,
    isCreating,
    updatePropertyId,
    deletePropertyId,
    error,
    hasLoaded,
    lastAction,
    lastCreatedPropertyId,
    lastRefreshCount,
    count,
    fetchProperties,
    refreshProperties,
    createProperty,
    updateProperty,
    deleteProperty,
    setError
  };
});
