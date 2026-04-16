import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { toApiErrorMessage } from '~/services/api.errors';
import { useAgentsApi } from '~/services/agents.api';
import type { AgentUser } from '~/types/agent';

const AUTH_STORAGE_KEY = 'iceberg.currentUser';

const safeParseUser = (value: string): AgentUser | null => {
  try {
    const parsed = JSON.parse(value) as AgentUser;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (
      typeof parsed.id !== 'string' ||
      typeof parsed.name !== 'string' ||
      typeof parsed.email !== 'string'
    ) {
      return null;
    }

    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      isActive: Boolean(parsed.isActive)
    };
  } catch {
    return null;
  }
};

export const useAuthStore = defineStore('auth', () => {
  const api = useAgentsApi();

  const currentUser = ref<AgentUser | null>(null);
  const users = ref<AgentUser[]>([]);
  const isHydrated = ref(false);
  const isLoggingIn = ref(false);
  const isRegistering = ref(false);
  const isLoadingUsers = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => currentUser.value !== null);
  const activeUsers = computed(() =>
    users.value.filter((user) => user.isActive).sort((a, b) => a.name.localeCompare(b.name))
  );

  const setError = (message: string | null) => {
    error.value = message;
  };

  const persistCurrentUser = () => {
    if (!import.meta.client) {
      return;
    }

    if (!currentUser.value) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser.value));
  };

  const hydrateFromStorage = () => {
    if (!import.meta.client || isHydrated.value) {
      return;
    }

    const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (rawUser) {
      currentUser.value = safeParseUser(rawUser);
    }

    isHydrated.value = true;
  };

  const fetchUsers = async () => {
    isLoadingUsers.value = true;
    setError(null);

    try {
      users.value = await api.listAgents();
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      isLoadingUsers.value = false;
    }
  };

  const register = async (payload: { name: string; email: string }) => {
    isRegistering.value = true;
    setError(null);

    try {
      const user = await api.registerAgent(payload);
      currentUser.value = user;
      persistCurrentUser();
      await fetchUsers();
      return user;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      isRegistering.value = false;
    }
  };

  const login = async (payload: { email: string }) => {
    isLoggingIn.value = true;
    setError(null);

    try {
      const user = await api.loginAgent(payload.email);
      currentUser.value = user;
      persistCurrentUser();
      await fetchUsers();
      return user;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      isLoggingIn.value = false;
    }
  };

  const logout = () => {
    currentUser.value = null;
    persistCurrentUser();
  };

  return {
    currentUser,
    users,
    isHydrated,
    isLoggingIn,
    isRegistering,
    isLoadingUsers,
    error,
    isAuthenticated,
    activeUsers,
    hydrateFromStorage,
    fetchUsers,
    register,
    login,
    logout,
    setError
  };
});
