import type { AgentUser, RegisterAgentPayload } from '~/types/agent';

const AGENTS_ENDPOINT = '/agents';
const AGENTS_LOGIN_ENDPOINT = '/agents/login';
const AGENTS_REGISTER_ENDPOINT = '/agents/register';
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

type ObjectIdLike = string | { toString(): string };

interface ApiAgent {
  _id?: ObjectIdLike;
  id?: ObjectIdLike;
  name?: string;
  email?: string;
  isActive?: boolean;
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
  isActive: Boolean(apiAgent.isActive)
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

    async registerAgent(payload: RegisterAgentPayload): Promise<AgentUser> {
      const response = await api.request<ApiAgent>(AGENTS_REGISTER_ENDPOINT, {
        method: 'POST',
        body: payload
      });

      return normalizeAgent(response);
    },

    async loginAgent(email: string): Promise<AgentUser> {
      const response = await api.request<ApiAgent>(AGENTS_LOGIN_ENDPOINT, {
        method: 'POST',
        body: { email }
      });

      return normalizeAgent(response);
    }
  };
};
