import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { toApiErrorMessage } from '~/services/api.errors';
import { useAgentsApi } from '~/services/agents.api';
import type { AgentRole, AgentUser, OrganizationSummary } from '~/types/agent';

const AUTH_STORAGE_KEY = 'iceberg.currentUser';
const SESSION_TOKEN_STORAGE_KEY = 'iceberg.session-token';

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

    const role: AgentRole =
      parsed.role === 'super_admin' ||
      parsed.role === 'office_owner' ||
      parsed.role === 'manager' ||
      parsed.role === 'agent' ||
      parsed.role === 'finance' ||
      parsed.role === 'assistant' ||
      parsed.role === 'admin'
        ? parsed.role
        : 'agent';
    const parsedOrganization =
      parsed.organization && typeof parsed.organization === 'object'
        ? (parsed.organization as OrganizationSummary)
        : null;
    const organization =
      parsedOrganization &&
      typeof parsedOrganization.id === 'string' &&
      typeof parsedOrganization.name === 'string' &&
      typeof parsedOrganization.slug === 'string'
        ? {
            id: parsedOrganization.id,
            name: parsedOrganization.name,
            slug: parsedOrganization.slug,
            isActive: Boolean(parsedOrganization.isActive)
          }
        : null;

    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      isActive: Boolean(parsed.isActive),
      role,
      organizationId:
        typeof parsed.organizationId === 'string'
          ? parsed.organizationId
          : organization?.id ?? null,
      organization,
      balance:
        typeof parsed.balance === 'number' && Number.isFinite(parsed.balance)
          ? parsed.balance
          : 0,
      balanceCents:
        typeof parsed.balanceCents === 'number' && Number.isFinite(parsed.balanceCents)
          ? parsed.balanceCents
          : 0,
      firstName: typeof parsed.firstName === 'string' ? parsed.firstName : '',
      lastName: typeof parsed.lastName === 'string' ? parsed.lastName : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      iban: typeof parsed.iban === 'string' ? parsed.iban : '',
      twoFactorEnabled: Boolean(parsed.twoFactorEnabled),
      twoFactorMethod: parsed.twoFactorMethod === 'sms' ? 'sms' : 'authenticator',
      twoFactorVerifiedAt:
        typeof parsed.twoFactorVerifiedAt === 'string' ? parsed.twoFactorVerifiedAt : null
    };
  } catch {
    return null;
  }
};

export const useAuthStore = defineStore('auth', () => {
  const api = useAgentsApi();

  const currentUser = ref<AgentUser | null>(null);
  const sessionToken = ref<string | null>(null);
  const users = ref<AgentUser[]>([]);
  const isHydrated = ref(false);
  const isLoggingIn = ref(false);
  const isRegistering = ref(false);
  const isLoadingUsers = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => currentUser.value !== null);
  const canManageTeam = computed(() => {
    const role = currentUser.value?.role;
    return role === 'super_admin' || role === 'office_owner' || role === 'admin' || role === 'manager';
  });
  const canAdministerUsers = computed(() => {
    const role = currentUser.value?.role;
    return role === 'super_admin' || role === 'office_owner' || role === 'admin';
  });
  const canManageBalances = computed(() => {
    const role = currentUser.value?.role;
    return (
      role === 'super_admin' ||
      role === 'office_owner' ||
      role === 'admin' ||
      role === 'manager' ||
      role === 'finance'
    );
  });
  const currentOrganization = computed(() => currentUser.value?.organization ?? null);
  const activeUsers = computed(() =>
    (users.value.length > 0 ? users.value : currentUser.value ? [currentUser.value] : [])
      .filter((user) => user.isActive)
      .sort((a, b) => a.name.localeCompare(b.name))
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
      window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser.value));
    if (sessionToken.value) {
      window.localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, sessionToken.value);
    }
  };

  const hydrateFromStorage = () => {
    if (!import.meta.client || isHydrated.value) {
      return;
    }

    const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
    const rawSessionToken = window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
    if (rawUser) {
      currentUser.value = safeParseUser(rawUser);
    }
    if (typeof rawSessionToken === 'string' && rawSessionToken.trim().length > 0) {
      sessionToken.value = rawSessionToken.trim();
    }

    isHydrated.value = true;
  };

  const fetchUsers = async () => {
    if (!canManageTeam.value) {
      users.value = currentUser.value ? [currentUser.value] : [];
      return;
    }

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

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    organizationName?: string;
    organizationSlug?: string;
    organizationId?: string;
  }) => {
    isRegistering.value = true;
    setError(null);

    try {
      const { user, sessionToken: nextSessionToken } = await api.registerAgent(payload);
      currentUser.value = user;
      sessionToken.value = nextSessionToken;
      persistCurrentUser();
      users.value = [user];
      await fetchUsers();
      return user;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      isRegistering.value = false;
    }
  };

  const login = async (payload: {
    email: string;
    password: string;
    twoFactorCode?: string;
    device?: string;
    location?: string;
    userAgent?: string;
  }) => {
    isLoggingIn.value = true;
    setError(null);

    try {
      const loginResult = await api.loginAgent(payload);

      if ('requiresTwoFactor' in loginResult) {
        return loginResult;
      }

      const user = loginResult.user;
      currentUser.value = user;
      sessionToken.value = loginResult.sessionToken;
      persistCurrentUser();
      users.value = [user];
      await fetchUsers();
      return user;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      isLoggingIn.value = false;
    }
  };

  const logout = async () => {
    if (sessionToken.value) {
      await api.logout(sessionToken.value).catch(() => undefined);
    }
    currentUser.value = null;
    sessionToken.value = null;
    persistCurrentUser();
  };

  return {
    currentUser,
    sessionToken,
    users,
    isHydrated,
    isLoggingIn,
    isRegistering,
    isLoadingUsers,
    error,
    isAuthenticated,
    canManageTeam,
    canAdministerUsers,
    canManageBalances,
    currentOrganization,
    activeUsers,
    hydrateFromStorage,
    fetchUsers,
    register,
    login,
    logout,
    setError
  };
});
