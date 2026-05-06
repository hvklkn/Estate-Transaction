import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { toApiErrorMessage } from '~/services/api.errors';
import { useAgentsApi } from '~/services/agents.api';
import type { AgentRole, AgentUser, CreateTeamMemberPayload, OrganizationSummary } from '~/types/agent';

const AUTH_STORAGE_KEY = 'iceberg.currentUser';
const SESSION_TOKEN_STORAGE_KEY = 'iceberg.session-token';

const RESOURCE_VIEWER_ROLES = new Set<AgentRole>(['super_admin', 'office_owner', 'admin', 'manager', 'agent', 'assistant', 'finance']);
const RESOURCE_CREATOR_ROLES = new Set<AgentRole>(['super_admin', 'office_owner', 'admin', 'manager', 'agent', 'assistant']);
const RESOURCE_MANAGER_ROLES = new Set<AgentRole>(['super_admin', 'office_owner', 'admin', 'manager']);
const TEAM_MANAGER_ROLES = new Set<AgentRole>(['super_admin', 'office_owner', 'admin', 'manager']);
const TENANT_ADMIN_ROLES = new Set<AgentRole>(['super_admin', 'office_owner', 'admin']);
const BALANCE_MANAGER_ROLES = new Set<AgentRole>(['super_admin', 'office_owner', 'admin', 'manager', 'finance']);

const isAgentRole = (value: unknown): value is AgentRole => value === 'super_admin' || value === 'office_owner' || value === 'manager' || value === 'agent' || value === 'finance' || value === 'assistant' || value === 'admin';

const normalizeStoredSessionToken = (value: string | null): string | null => {
  const normalizedValue = value?.trim() ?? '';
  return normalizedValue.length > 0 ? normalizedValue : null;
};

const getErrorStatus = (unknownError: unknown): number | null => {
  const errorRecord = unknownError as {
    status?: number;
    statusCode?: number;
    response?: { status?: number };
    data?: { statusCode?: number };
  };
  return errorRecord.status ?? errorRecord.statusCode ?? errorRecord.response?.status ?? errorRecord.data?.statusCode ?? null;
};

const safeParseUser = (value: string): AgentUser | null => {
  try {
    const parsed = JSON.parse(value) as AgentUser;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (typeof parsed.id !== 'string' || typeof parsed.name !== 'string' || typeof parsed.email !== 'string') {
      return null;
    }

    const role: AgentRole = isAgentRole(parsed.role) ? parsed.role : 'agent';
    const parsedOrganization = parsed.organization && typeof parsed.organization === 'object' ? (parsed.organization as OrganizationSummary) : null;
    const organization =
      parsedOrganization && typeof parsedOrganization.id === 'string' && typeof parsedOrganization.name === 'string' && typeof parsedOrganization.slug === 'string'
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
      organizationId: typeof parsed.organizationId === 'string' ? parsed.organizationId : (organization?.id ?? null),
      organization,
      balance: typeof parsed.balance === 'number' && Number.isFinite(parsed.balance) ? parsed.balance : 0,
      balanceCents: typeof parsed.balanceCents === 'number' && Number.isFinite(parsed.balanceCents) ? parsed.balanceCents : 0,
      firstName: typeof parsed.firstName === 'string' ? parsed.firstName : '',
      lastName: typeof parsed.lastName === 'string' ? parsed.lastName : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      iban: typeof parsed.iban === 'string' ? parsed.iban : '',
      twoFactorEnabled: Boolean(parsed.twoFactorEnabled),
      twoFactorMethod: parsed.twoFactorMethod === 'sms' ? 'sms' : 'authenticator',
      twoFactorVerifiedAt: typeof parsed.twoFactorVerifiedAt === 'string' ? parsed.twoFactorVerifiedAt : null
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
  const isCreatingUser = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => currentUser.value !== null);
  const canViewTenantResources = computed(() => {
    const role = currentUser.value?.role;
    return Boolean(role && RESOURCE_VIEWER_ROLES.has(role));
  });
  const canManageTeam = computed(() => {
    const role = currentUser.value?.role;
    return Boolean(role && TEAM_MANAGER_ROLES.has(role));
  });
  const canAdministerUsers = computed(() => {
    const role = currentUser.value?.role;
    return Boolean(role && TENANT_ADMIN_ROLES.has(role));
  });
  const canManageBalances = computed(() => {
    const role = currentUser.value?.role;
    return Boolean(role && BALANCE_MANAGER_ROLES.has(role));
  });
  const canCreateTenantResources = computed(() => {
    const role = currentUser.value?.role;
    return Boolean(role && RESOURCE_CREATOR_ROLES.has(role));
  });
  const canManageTenantResources = computed(() => {
    const role = currentUser.value?.role;
    return Boolean(role && RESOURCE_MANAGER_ROLES.has(role));
  });
  const currentOrganization = computed(() => currentUser.value?.organization ?? null);
  const activeUsers = computed(() => (users.value.length > 0 ? users.value : currentUser.value ? [currentUser.value] : []).filter((user) => user.isActive).sort((a, b) => a.name.localeCompare(b.name)));

  const setError = (message: string | null) => {
    error.value = message;
  };

  const clearSession = () => {
    currentUser.value = null;
    sessionToken.value = null;
    users.value = [];
  };

  const persistCurrentUser = () => {
    if (!import.meta.client) {
      return;
    }

    if (!currentUser.value || !sessionToken.value) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser.value));
    window.localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, sessionToken.value);
  };

  const hydrateFromStorage = () => {
    if (!import.meta.client || isHydrated.value) {
      return;
    }

    const parsedUser = safeParseUser(window.localStorage.getItem(AUTH_STORAGE_KEY) ?? '');
    const storedSessionToken = normalizeStoredSessionToken(window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY));

    if (parsedUser && storedSessionToken) {
      currentUser.value = parsedUser;
      sessionToken.value = storedSessionToken;
    } else {
      clearSession();
      persistCurrentUser();
    }

    isHydrated.value = true;
  };

  const refreshCurrentUser = async (options: { silent?: boolean } = {}) => {
    hydrateFromStorage();

    if (!sessionToken.value) {
      clearSession();
      persistCurrentUser();
      return null;
    }

    try {
      const user = await api.getMyProfile(sessionToken.value);
      currentUser.value = user;
      users.value = users.value.some((existingUser) => existingUser.id === user.id) ? users.value.map((existingUser) => (existingUser.id === user.id ? user : existingUser)) : [user];
      persistCurrentUser();
      return user;
    } catch (unknownError) {
      if (getErrorStatus(unknownError) === 401) {
        clearSession();
        persistCurrentUser();
      }

      if (!options.silent) {
        setError(toApiErrorMessage(unknownError));
      }

      throw unknownError;
    }
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

  const createTeamMember = async (payload: CreateTeamMemberPayload) => {
    if (!canManageTeam.value) {
      const permissionError = new Error('Your role cannot create team members.');
      setError(permissionError.message);
      throw permissionError;
    }

    isCreatingUser.value = true;
    setError(null);

    try {
      const user = await api.createAgent(payload);
      await fetchUsers();
      users.value = users.value.some((existingUser) => existingUser.id === user.id) ? users.value.map((existingUser) => (existingUser.id === user.id ? user : existingUser)) : [user, ...users.value];
      return user;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      isCreatingUser.value = false;
    }
  };

  const register = async (payload: { name: string; email: string; password: string; organizationName?: string; organizationSlug?: string; organizationId?: string }) => {
    isRegistering.value = true;
    setError(null);

    try {
      const { user, sessionToken: nextSessionToken } = await api.registerAgent(payload);
      currentUser.value = user;
      sessionToken.value = nextSessionToken;
      persistCurrentUser();
      const hydratedUser = await refreshCurrentUser({ silent: true });
      users.value = [hydratedUser ?? user];
      await fetchUsers();
      return hydratedUser ?? user;
    } catch (unknownError) {
      setError(toApiErrorMessage(unknownError));
      throw unknownError;
    } finally {
      isRegistering.value = false;
    }
  };

  const login = async (payload: { email: string; password: string; twoFactorCode?: string; device?: string; location?: string; userAgent?: string }) => {
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
      const hydratedUser = await refreshCurrentUser({ silent: true });
      users.value = [hydratedUser ?? user];
      await fetchUsers();
      return hydratedUser ?? user;
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
    clearSession();
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
    isCreatingUser,
    error,
    isAuthenticated,
    canManageTeam,
    canAdministerUsers,
    canManageBalances,
    canViewTenantResources,
    canCreateTenantResources,
    canManageTenantResources,
    currentOrganization,
    activeUsers,
    hydrateFromStorage,
    refreshCurrentUser,
    fetchUsers,
    createTeamMember,
    register,
    login,
    logout,
    setError
  };
});
