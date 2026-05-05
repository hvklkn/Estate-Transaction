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

  const count = computed(() => items.value.length);

  const setError = (message: string | null) => {
    error.value = message;
  };

  const fetchProperties = async (options: { force?: boolean } = {}) => {
    if (isLoading.value || (hasLoaded.value && !options.force)) {
      return;
    }

    isLoading.value = true;
    setError(null);

    try {
      items.value = await api.listProperties();
      hasLoaded.value = true;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
    } finally {
      isLoading.value = false;
    }
  };

  const refreshProperties = async () => {
    await fetchProperties({ force: true });
  };

  const createProperty = async (payload: CreatePropertyPayload) => {
    isCreating.value = true;
    setError(null);

    try {
      const property = await api.createProperty(payload);
      await refreshProperties();
      return property;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      isCreating.value = false;
    }
  };

  const updateProperty = async (id: string, payload: UpdatePropertyPayload) => {
    updatePropertyId.value = id;
    setError(null);

    try {
      const property = await api.updateProperty(id, payload);
      await refreshProperties();
      return property;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      updatePropertyId.value = null;
    }
  };

  const deleteProperty = async (id: string) => {
    deletePropertyId.value = id;
    setError(null);

    try {
      const result = await api.deleteProperty(id);
      await refreshProperties();
      return result;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
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
    count,
    fetchProperties,
    refreshProperties,
    createProperty,
    updateProperty,
    deleteProperty,
    setError
  };
});
