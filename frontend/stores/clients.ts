import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { toApiErrorMessage } from '~/services/api.errors';
import { useClientsApi } from '~/services/clients.api';
import type { Client, CreateClientPayload, UpdateClientPayload } from '~/types/client';

export const useClientsStore = defineStore('clients', () => {
  const api = useClientsApi();

  const items = ref<Client[]>([]);
  const isLoading = ref(false);
  const isCreating = ref(false);
  const updateClientId = ref<string | null>(null);
  const deleteClientId = ref<string | null>(null);
  const error = ref<string | null>(null);
  const hasLoaded = ref(false);

  const count = computed(() => items.value.length);

  const setError = (message: string | null) => {
    error.value = message;
  };

  const fetchClients = async (options: { force?: boolean } = {}) => {
    if (isLoading.value || (hasLoaded.value && !options.force)) {
      return;
    }

    isLoading.value = true;
    setError(null);

    try {
      items.value = await api.listClients();
      hasLoaded.value = true;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
    } finally {
      isLoading.value = false;
    }
  };

  const refreshClients = async () => {
    await fetchClients({ force: true });
  };

  const createClient = async (payload: CreateClientPayload) => {
    isCreating.value = true;
    setError(null);

    try {
      const client = await api.createClient(payload);
      await refreshClients();
      return client;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      isCreating.value = false;
    }
  };

  const updateClient = async (id: string, payload: UpdateClientPayload) => {
    updateClientId.value = id;
    setError(null);

    try {
      const client = await api.updateClient(id, payload);
      await refreshClients();
      return client;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      updateClientId.value = null;
    }
  };

  const deleteClient = async (id: string) => {
    deleteClientId.value = id;
    setError(null);

    try {
      const result = await api.deleteClient(id);
      await refreshClients();
      return result;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      deleteClientId.value = null;
    }
  };

  return {
    items,
    isLoading,
    isCreating,
    updateClientId,
    deleteClientId,
    error,
    hasLoaded,
    count,
    fetchClients,
    refreshClients,
    createClient,
    updateClient,
    deleteClient,
    setError
  };
});
