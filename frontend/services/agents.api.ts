import type { AgentUser, RegisterAgentPayload } from '~/types/agent';

const AGENTS_ENDPOINT = '/agents';
const AGENTS_LOGIN_ENDPOINT = '/agents/login';
const AGENTS_REGISTER_ENDPOINT = '/agents/register';
const AGENTS_PASSWORD_FORGOT_ENDPOINT = '/agents/password/forgot';
const AGENTS_PASSWORD_RESET_ENDPOINT = '/agents/password/reset';
const AGENTS_LOGOUT_ENDPOINT = '/agents/logout';
const AGENTS_ME_PROFILE_ENDPOINT = '/agents/me/profile';
const AGENTS_ME_PASSWORD_ENDPOINT = '/agents/me/password';
const AGENTS_ME_2FA_SETUP_ENDPOINT = '/agents/me/2fa/setup';
const AGENTS_ME_2FA_VERIFY_ENDPOINT = '/agents/me/2fa/verify';
const AGENTS_ME_2FA_DISABLE_ENDPOINT = '/agents/me/2fa/disable';
const AGENTS_ME_SESSIONS_ENDPOINT = '/agents/me/sessions';
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

type ObjectIdLike = string | { toString(): string };

interface ApiAgent {
  _id?: ObjectIdLike;
  id?: ObjectIdLike;
  name?: string;
  email?: string;
  isActive?: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  iban?: string;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'sms' | 'authenticator';
  twoFactorVerifiedAt?: string | null;
  role?: 'agent' | 'manager' | 'admin';
  balance?: number;
  balanceCents?: number;
}

interface ApiSession {
  id?: string;
  device?: string;
  location?: string;
  userAgent?: string;
  createdAt?: string;
  lastActiveAt?: string;
  current?: boolean;
}

interface ApiLoginResponse {
  requiresTwoFactor?: boolean;
  twoFactorMethod?: 'sms' | 'authenticator';
  sessionToken?: string;
  agent?: ApiAgent;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};

const toRequiredString = (value: unknown, fieldName: string): string => {
  const normalizedValue = toNonEmptyString(value);

  if (!normalizedValue) {
    throw new Error(`Invalid API response: missing or invalid "${fieldName}".`);
  }

  return normalizedValue;
};

const toOptionalFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
};

const toOptionalObjectIdString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return toNonEmptyString(value);
  }

  if (isObject(value) && typeof value.toString === 'function') {
    return toNonEmptyString(value.toString());
  }

  return null;
};

const toRequiredObjectIdString = (value: unknown, fieldName: string): string => {
  const normalizedValue = toOptionalObjectIdString(value);

  if (!normalizedValue || !OBJECT_ID_REGEX.test(normalizedValue)) {
    throw new Error(`Invalid API response: missing or invalid "${fieldName}".`);
  }

  return normalizedValue;
};

const normalizeAgent = (apiAgent: ApiAgent): AgentUser => ({
  id: toRequiredObjectIdString(apiAgent.id ?? apiAgent._id, 'agent.id'),
  name: toRequiredString(apiAgent.name, 'agent.name'),
  email: toRequiredString(apiAgent.email, 'agent.email'),
  isActive: Boolean(apiAgent.isActive),
  role:
    apiAgent.role === 'admin' || apiAgent.role === 'manager' ? apiAgent.role : 'agent',
  balance: toOptionalFiniteNumber(apiAgent.balance) ?? 0,
  balanceCents: toOptionalFiniteNumber(apiAgent.balanceCents) ?? 0,
  firstName: typeof apiAgent.firstName === 'string' ? apiAgent.firstName : '',
  lastName: typeof apiAgent.lastName === 'string' ? apiAgent.lastName : '',
  phone: typeof apiAgent.phone === 'string' ? apiAgent.phone : '',
  iban: typeof apiAgent.iban === 'string' ? apiAgent.iban : '',
  twoFactorEnabled: Boolean(apiAgent.twoFactorEnabled),
  twoFactorMethod: apiAgent.twoFactorMethod === 'sms' ? 'sms' : 'authenticator',
  twoFactorVerifiedAt:
    typeof apiAgent.twoFactorVerifiedAt === 'string' ? apiAgent.twoFactorVerifiedAt : null
});

const createAuthHeaders = (sessionToken: string): HeadersInit => ({
  Authorization: `Bearer ${sessionToken}`
});

export const useAgentsApi = () => {
  const api = useApi();

  return {
    async listAgents(): Promise<AgentUser[]> {
      const response = await api.request<ApiAgent[]>(AGENTS_ENDPOINT);

      if (!Array.isArray(response)) {
        throw new Error('Invalid API response: expected an agent array.');
      }

      return response.map(normalizeAgent);
    },

    async registerAgent(payload: RegisterAgentPayload): Promise<{ user: AgentUser; sessionToken: string }> {
      const response = await api.request<{ agent?: ApiAgent; sessionToken?: string }>(
        AGENTS_REGISTER_ENDPOINT,
        {
          method: 'POST',
          body: payload
        }
      );

      return {
        user: normalizeAgent(response.agent ?? {}),
        sessionToken: toRequiredString(response.sessionToken, 'sessionToken')
      };
    },

    async loginAgent(payload: {
      email: string;
      password: string;
      twoFactorCode?: string;
      device?: string;
      location?: string;
      userAgent?: string;
    }): Promise<
      | { requiresTwoFactor: true; twoFactorMethod: 'sms' | 'authenticator' }
      | { user: AgentUser; sessionToken: string }
    > {
      const response = await api.request<ApiLoginResponse>(AGENTS_LOGIN_ENDPOINT, {
        method: 'POST',
        body: payload
      });

      if (response.requiresTwoFactor) {
        return {
          requiresTwoFactor: true,
          twoFactorMethod: response.twoFactorMethod === 'sms' ? 'sms' : 'authenticator'
        };
      }

      return {
        user: normalizeAgent(response.agent ?? {}),
        sessionToken: toRequiredString(response.sessionToken, 'sessionToken')
      };
    },

    async requestPasswordResetCode(payload: { email: string }): Promise<{ developmentCode?: string }> {
      const response = await api.request<{ success: boolean; developmentCode?: string }>(
        AGENTS_PASSWORD_FORGOT_ENDPOINT,
        {
          method: 'POST',
          body: payload
        }
      );

      return {
        developmentCode: toNonEmptyString(response.developmentCode) ?? undefined
      };
    },

    async resetPasswordWithCode(payload: {
      email: string;
      code: string;
      newPassword: string;
      confirmNewPassword: string;
    }): Promise<void> {
      await api.request<{ success: boolean }>(AGENTS_PASSWORD_RESET_ENDPOINT, {
        method: 'POST',
        body: payload
      });
    },

    async logout(sessionToken: string): Promise<void> {
      await api.request<{ success: boolean }>(AGENTS_LOGOUT_ENDPOINT, {
        method: 'POST',
        headers: createAuthHeaders(sessionToken)
      });
    },

    async getMyProfile(sessionToken: string): Promise<AgentUser> {
      const response = await api.request<ApiAgent>(AGENTS_ME_PROFILE_ENDPOINT, {
        headers: createAuthHeaders(sessionToken)
      });

      return normalizeAgent(response);
    },

    async updateMyProfile(
      sessionToken: string,
      payload: {
        name: string;
        email: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        iban?: string;
      }
    ): Promise<AgentUser> {
      const response = await api.request<ApiAgent>(AGENTS_ME_PROFILE_ENDPOINT, {
        method: 'PATCH',
        headers: createAuthHeaders(sessionToken),
        body: payload
      });

      return normalizeAgent(response);
    },

    async changeMyPassword(
      sessionToken: string,
      payload: { currentPassword: string; newPassword: string; confirmNewPassword: string }
    ): Promise<void> {
      await api.request<{ success: boolean }>(AGENTS_ME_PASSWORD_ENDPOINT, {
        method: 'PATCH',
        headers: createAuthHeaders(sessionToken),
        body: payload
      });
    },

    async setupMyTwoFactor(
      sessionToken: string,
      payload: { method: 'sms' | 'authenticator' }
    ): Promise<{ method: 'sms' | 'authenticator'; secret: string; otpauthUrl: string }> {
      const response = await api.request<{
        method?: 'sms' | 'authenticator';
        secret?: string;
        otpauthUrl?: string;
      }>(AGENTS_ME_2FA_SETUP_ENDPOINT, {
        method: 'POST',
        headers: createAuthHeaders(sessionToken),
        body: payload
      });

      return {
        method: response.method === 'sms' ? 'sms' : 'authenticator',
        secret: toRequiredString(response.secret, 'secret'),
        otpauthUrl: toRequiredString(response.otpauthUrl, 'otpauthUrl')
      };
    },

    async verifyMyTwoFactor(
      sessionToken: string,
      payload: { code: string }
    ): Promise<{ verifiedAt: string }> {
      const response = await api.request<{ verifiedAt?: string }>(AGENTS_ME_2FA_VERIFY_ENDPOINT, {
        method: 'POST',
        headers: createAuthHeaders(sessionToken),
        body: payload
      });

      return {
        verifiedAt: toRequiredString(response.verifiedAt, 'verifiedAt')
      };
    },

    async disableMyTwoFactor(sessionToken: string): Promise<void> {
      await api.request<{ success: boolean }>(AGENTS_ME_2FA_DISABLE_ENDPOINT, {
        method: 'POST',
        headers: createAuthHeaders(sessionToken)
      });
    },

    async listMySessions(sessionToken: string): Promise<{
      currentSessionId: string;
      sessions: Array<{
        id: string;
        device: string;
        location: string;
        userAgent: string;
        createdAt: string;
        lastActiveAt: string;
        current: boolean;
      }>;
    }> {
      const response = await api.request<{
        currentSessionId?: string;
        sessions?: ApiSession[];
      }>(AGENTS_ME_SESSIONS_ENDPOINT, {
        headers: createAuthHeaders(sessionToken)
      });

      return {
        currentSessionId: toRequiredString(response.currentSessionId, 'currentSessionId'),
        sessions: (response.sessions ?? []).map((session, index) => ({
          id: toRequiredString(session.id, `sessions[${index}].id`),
          device: toRequiredString(session.device, `sessions[${index}].device`),
          location: toRequiredString(session.location, `sessions[${index}].location`),
          userAgent: toRequiredString(session.userAgent, `sessions[${index}].userAgent`),
          createdAt: toRequiredString(session.createdAt, `sessions[${index}].createdAt`),
          lastActiveAt: toRequiredString(session.lastActiveAt, `sessions[${index}].lastActiveAt`),
          current: Boolean(session.current)
        }))
      };
    },

    async revokeMySession(sessionToken: string, sessionId: string): Promise<void> {
      await api.request<{ success: boolean }>(`${AGENTS_ME_SESSIONS_ENDPOINT}/${sessionId}`, {
        method: 'DELETE',
        headers: createAuthHeaders(sessionToken)
      });
    },

    async revokeMyOtherSessions(sessionToken: string): Promise<void> {
      await api.request<{ success: boolean }>(AGENTS_ME_SESSIONS_ENDPOINT, {
        method: 'DELETE',
        headers: createAuthHeaders(sessionToken)
      });
    }
  };
};
